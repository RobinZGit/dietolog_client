/* === GET modes (v11) — injected into dietolog.html ===
 *
 * mode=nutrients  — list nutrients; expand → top TOP_N products with amount + % of daily min
 * mode=layout&items=slug:grams,slug:grams
 *   or ?layout=slug:grams,...
 *   items may also be JSON: [{"n":"slug","g":100},{"n":"id:193","g":50}]
 *
 * Layout line format (readable in URL, Latin preferred):
 *   grechiha_zerno:150,yajco_kurinoe_celoe:100,moloko_suhoe_1:30
 *   Separators: comma between products, colon between name and grams (or pieces for БАД).
 *   Names: Latin translit of Russian catalog names, or Russian, or id:123 / #123.
 */

const TOP_N = 15;
const LAYOUT_COMPLETE_RATIO = 0.92;
const LAYOUT_MAX_ITERS = 35;
const LAYOUT_MAX_ADD_G = 400;
const SPICE_NAME_RE = /сушен|молот(ый|ая|ое)|специ|перец\b|базилик|гвоздик|кориц|кардамон|куркум|орегано|тимьян|мята\b|лавровый|майоран|фенхель|имбирь|шалфей|укроп суш|петрушка суш|кориандр/i;

function parseQuery() {
  const sp = new URLSearchParams(location.search);
  let mode = (sp.get('mode') || '').trim().toLowerCase();
  const nutrientsFlag = sp.get('nutrients');
  const layoutRaw = sp.get('layout');
  const itemsRaw = sp.get('items');
  if (!mode && (nutrientsFlag === '1' || nutrientsFlag === 'true')) mode = 'nutrients';
  if (!mode && (layoutRaw || itemsRaw)) mode = 'layout';
  if (!mode) mode = 'browse';
  return {
    mode,
    itemsRaw: itemsRaw || layoutRaw || '',
  };
}

function pageBaseUrl() {
  // strip query/hash; keep path to this html
  return location.href.split('#')[0].split('?')[0];
}

/** Cyrillic → Latin (passport-ish) for URL slugs */
const CYR2LAT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};
const LAT2CYR_MULTI = [
  ['sch', 'щ'], ['zh', 'ж'], ['ch', 'ч'], ['sh', 'ш'], ['yu', 'ю'], ['ya', 'я'],
  ['yo', 'ё'], ['ju', 'ю'], ['ja', 'я'],
];
const LAT2CYR = {
  a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', z: 'з', i: 'и', j: 'й',
  k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', t: 'т',
  u: 'у', f: 'ф', h: 'х', c: 'ц', y: 'ы', w: 'в', x: 'кс', q: 'к',
};

function toLatinSlug(name) {
  let out = '';
  for (const ch of String(name).toLowerCase()) {
    if (CYR2LAT[ch] !== undefined) out += CYR2LAT[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else if (/[\s\-_/.,()]/.test(ch)) out += '_';
  }
  return out.replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 64);
}

function latinToCyrApprox(slug) {
  let s = String(slug || '').toLowerCase().replace(/_/g, ' ');
  let out = '';
  let i = 0;
  while (i < s.length) {
    let hit = false;
    for (const [lat, cyr] of LAT2CYR_MULTI) {
      if (s.startsWith(lat, i)) {
        out += cyr;
        i += lat.length;
        hit = true;
        break;
      }
    }
    if (hit) continue;
    const ch = s[i];
    if (LAT2CYR[ch]) out += LAT2CYR[ch];
    else if (ch === ' ' || /[0-9а-яё]/.test(ch)) out += ch;
    i += 1;
  }
  return out.replace(/\s+/g, ' ').trim();
}

function normalizeKey(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return dp[n];
}

/** @type {Array<{p:any,slug:string,norm:string,cyrFromSlug:string}>} */
let matchIndex = [];

function buildMatchIndex() {
  matchIndex = productsCache.map((p) => {
    const slug = toLatinSlug(p.name);
    return {
      p,
      slug,
      norm: normalizeKey(p.name),
      cyrFromSlug: normalizeKey(latinToCyrApprox(slug)),
    };
  });
}

function parseIdToken(raw) {
  const s = String(raw || '').trim();
  let m = /^id[:#]?(\d+)$/i.exec(s);
  if (m) return Number(m[1]);
  m = /^#(\d+)$/.exec(s);
  if (m) return Number(m[1]);
  return null;
}

function scoreMatch(queryRaw, entry) {
  const qLatin = normalizeKey(String(queryRaw).replace(/_/g, ' '));
  const qCyr = normalizeKey(latinToCyrApprox(String(queryRaw).replace(/_/g, ' ')));
  const q = qLatin.length >= qCyr.length ? qLatin : qCyr;
  if (!q) return 0;
  if (entry.norm === q || entry.norm === qCyr || entry.slug === toLatinSlug(queryRaw)) return 1000;
  if (entry.norm.startsWith(q) || entry.norm.startsWith(qCyr)) return 800;
  if (entry.norm.includes(q) || entry.norm.includes(qCyr)) return 600;
  if (entry.slug.includes(toLatinSlug(queryRaw))) return 500;
  const d1 = levenshtein(entry.norm.slice(0, Math.max(q.length + 4, 12)), q);
  const d2 = levenshtein(entry.norm.slice(0, Math.max(qCyr.length + 4, 12)), qCyr);
  const d = Math.min(d1, d2);
  const maxLen = Math.max(entry.norm.length, q.length, 1);
  return Math.max(0, 400 - d * 25) * (1 - d / maxLen);
}

function findProductByName(rawName) {
  const id = parseIdToken(rawName);
  if (id != null) {
    const p = productsCache.find((x) => x.id === id);
    return p
      ? { product: p, score: 1000, original: rawName }
      : { product: null, score: 0, original: rawName };
  }
  if (!matchIndex.length) buildMatchIndex();
  let best = null;
  let bestScore = 0;
  for (const entry of matchIndex) {
    const sc = scoreMatch(rawName, entry);
    if (sc > bestScore) {
      bestScore = sc;
      best = entry.p;
    }
  }
  // threshold: require some similarity
  if (bestScore < 180) best = null;
  return { product: best, score: bestScore, original: rawName };
}

/**
 * Parse layout line.
 * Formats:
 *  - slug:grams,slug:grams
 *  - JSON array [{n|name|id, g|grams|q|qty}]
 */
function parseLayoutItems(raw) {
  const text = String(raw || '').trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    try {
      const arr = JSON.parse(text);
      return arr.map((row) => ({
        original: String(row.n || row.name || row.id || ''),
        grams: Number(row.g || row.grams || row.q || row.qty || 0),
      })).filter((x) => x.original && x.grams > 0);
    } catch (e) {
      console.warn('layout JSON parse failed', e);
    }
  }
  return text.split(/[,;|]+/).map((part) => {
    const p = part.trim();
    if (!p) return null;
    const m = /^(.+?)[=:](\d+(?:\.\d+)?)$/.exec(p);
    if (!m) return { original: p, grams: 100 };
    return { original: m[1].trim(), grams: Number(m[2]) };
  }).filter(Boolean);
}

function nutrientMin(n) {
  const v = n && n.min != null ? Number(n.min) : 0;
  return v > 0 ? v : 0;
}

function productNutrientPerBase(productId, nutrientId) {
  const items = infoCache.get(productId) || [];
  for (const [nid, val] of items) {
    if (nid === nutrientId) return Number(val) || 0;
  }
  return 0;
}

/** Amount of nutrient in given grams (food: values are per 100g; BAD: value/100 per piece, grams≈pieces) */
function amountInPortion(product, nutrientId, grams) {
  const per = productNutrientPerBase(product.id, nutrientId);
  if (!per) return 0;
  if (product.section === 'bad') {
    // stored as dose*100 per "100g formula"; UI shows /100 per piece
    return (per / 100) * grams;
  }
  return per * (grams / 100);
}

function topProductsForNutrient(nutrientId, limit) {
  const n = nutrientById.get(nutrientId);
  const daily = nutrientMin(n);
  const rows = [];
  for (const p of productsCache) {
    const per = productNutrientPerBase(p.id, nutrientId);
    if (!per) continue;
    const show = p.section === 'bad' ? per / 100 : per;
    const pct = daily > 0 ? (show / daily) * 100 : 0;
    rows.push({ product: p, amount: show, pct });
  }
  rows.sort((a, b) => b.amount - a.amount);
  return rows.slice(0, limit || TOP_N);
}

function renderNutrientsMode(panel) {
  const nutrients = Array.from(nutrientById.values()).slice().sort((a, b) =>
    String(a.name).localeCompare(String(b.name), 'ru')
  );
  panel.innerHTML = '';
  const box = document.createElement('section');
  box.className = 'mode-card';
  box.innerHTML =
    '<h2>Содержание нутриентов — главные продукты</h2>' +
    '<p class="mode-note">Раскройте нутриент: до ' + TOP_N +
    ' продуктов с наибольшим содержанием и % от суточного минимума (на 100 г / 1 шт. для БАД).</p>';
  const list = document.createElement('div');
  list.className = 'list mode-list';
  for (const n of nutrients) {
    const wrap = document.createElement('div');
    wrap.className = 'group';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'group-head';
    btn.innerHTML =
      '<span class="chev">▸</span><span class="gname"></span><span class="pmeta"></span>';
    btn.querySelector('.gname').textContent = n.name;
    const daily = nutrientMin(n);
    btn.querySelector('.pmeta').textContent =
      daily ? ('норма min ' + formatValue(daily, n.units)) : '';
    const body = document.createElement('div');
    body.className = 'group-body';
    body.dataset.loaded = '0';
    btn.addEventListener('click', () => {
      const open = wrap.classList.toggle('open');
      if (!open || body.dataset.loaded === '1') return;
      const tops = topProductsForNutrient(n.id, TOP_N);
      if (!tops.length) {
        body.innerHTML = '<div class="empty">Нет продуктов с этим нутриентом</div>';
      } else {
        let html = '<table class="mode-table"><thead><tr>' +
          '<th>Продукт</th><th>Содержание</th><th>% нормы</th></tr></thead><tbody>';
        for (const row of tops) {
          html += '<tr><td>' + escapeHtml(row.product.name) +
            (row.product.section === 'bad' ? ' <span class="badge-bad">БАД</span>' : '') +
            '</td><td class="num">' + escapeHtml(formatValue(row.amount, n.units)) +
            '</td><td class="num">' + (row.pct ? row.pct.toFixed(0) + '%' : '—') +
            '</td></tr>';
        }
        html += '</tbody></table>';
        body.innerHTML = html;
      }
      body.dataset.loaded = '1';
    });
    wrap.appendChild(btn);
    wrap.appendChild(body);
    list.appendChild(wrap);
  }
  box.appendChild(list);
  panel.appendChild(box);
}

function accumulateLayout(matchedItems) {
  /** @type {Map<number, number>} */
  const totals = new Map();
  for (const n of nutrientById.values()) totals.set(n.id, 0);
  for (const it of matchedItems) {
    if (!it.product) continue;
    for (const n of nutrientById.values()) {
      const add = amountInPortion(it.product, n.id, it.grams);
      if (add) totals.set(n.id, (totals.get(n.id) || 0) + add);
    }
  }
  return totals;
}

function analyzeDuration(totals) {
  let durationAll = 0;
  let durationNutrientAll = null;
  let durationMacro = 0;
  let durationNutrientMacro = null;
  const daysByNutrient = new Map();
  const MACRO_NAMES = /^(Калорийность|Белки|Жиры|Углеводы)$/i;
  for (const n of nutrientById.values()) {
    const daily = nutrientMin(n);
    if (!daily) continue;
    const total = totals.get(n.id) || 0;
    if (total <= 0) continue;
    const days = total / daily;
    daysByNutrient.set(n.id, days);
    if (days > durationAll) {
      durationAll = days;
      durationNutrientAll = n;
    }
    if (MACRO_NAMES.test(String(n.name)) && days > durationMacro) {
      durationMacro = days;
      durationNutrientMacro = n;
    }
  }
  // Practical plan length: macros. Absolute max (often Si/trace) kept for note.
  let duration = durationMacro > 0.05 ? durationMacro : durationAll;
  let durationNutrient = durationMacro > 0.05 ? durationNutrientMacro : durationNutrientAll;
  if (duration < 0.05) duration = 1;
  return {
    duration,
    durationNutrient,
    durationAll: durationAll || duration,
    durationNutrientAll,
    daysByNutrient,
  };
}

function nutrientDataCoverage(nutrientId) {
  let hit = 0;
  for (const p of productsCache) {
    if (productNutrientPerBase(p.id, nutrientId) > 0) hit++;
  }
  return productsCache.length ? hit / productsCache.length : 0;
}

function nutrientHasBad(nutrientId) {
  for (const p of productsCache) {
    if (p.section !== 'bad') continue;
    if (productNutrientPerBase(p.id, nutrientId) > 0) return true;
  }
  return false;
}

function isFillableNutrient(n) {
  // foods with decent coverage OR any BAD can cover this nutrient
  return nutrientDataCoverage(n.id) >= 0.2 || nutrientHasBad(n.id);
}

function maxPortionForProduct(product) {
  if (product.section === 'bad') return 5; // tablets
  if ((product.group || '') === 'Специи и приправы' || SPICE_NAME_RE.test(product.name)) return 10;
  if (/печень|почки|устриц|мидии|трубач/i.test(product.name)) return 100;
  return 250;
}

function shortagesForDuration(totals, duration) {
  const rows = [];
  for (const n of nutrientById.values()) {
    const daily = nutrientMin(n);
    if (!daily) continue;
    const need = duration * daily;
    const have = totals.get(n.id) || 0;
    const shortage = Math.max(0, need - have);
    const pct = need > 0 ? (have / need) * 100 : 100;
    rows.push({
      n, daily, need, have, shortage, pct,
      fillable: isFillableNutrient(n),
    });
  }
  rows.sort((a, b) => b.shortage / Math.max(b.daily, 1e-9) - a.shortage / Math.max(a.daily, 1e-9));
  return rows;
}

function cloneTotals(totals) {
  return new Map(totals);
}

/**
 * Greedy fill.
 * options.preferBad = false → foods only (examples 1–2)
 * options.preferBad = true  → foods first, then BADs for leftover gaps (example 3 «с БАД»)
 * options.excludeIds = Set|Array of product ids never to recommend
 */
function recommendAdditions(baseTotals, duration, variantShift, options) {
  const preferBad = !!(options && options.preferBad);
  const totals = cloneTotals(baseTotals);
  const added = [];
  const usedIds = new Set();
  const excludeIds = new Set(
    (options && options.excludeIds) ? [...options.excludeIds].map(Number) : []
  );
  for (const id of excludeIds) usedIds.add(id);
  const skippedNutrientIds = new Set();
  for (let iter = 0; iter < LAYOUT_MAX_ITERS; iter++) {
    const gaps = shortagesForDuration(totals, duration);
    const worst = gaps.find((g) =>
      g.fillable &&
      !skippedNutrientIds.has(g.n.id) &&
      g.pct < LAYOUT_COMPLETE_RATIO * 100 &&
      g.shortage > 0
    );
    if (!worst) break;

    const ranked = topProductsForNutrient(worst.n.id, 80);
    const badCandidates = ranked.filter((r) => r.product.section === 'bad');
    const foodCandidates = ranked.filter((r) => r.product.section !== 'bad');
    // foods only OR foods first + BADs for remaining gaps («немного БАД» in example 3)
    const pools = preferBad ? [foodCandidates, badCandidates] : [foodCandidates];

    let chosen = null;
    let grams = 0;
    outer:
    for (const pool of pools) {
      if (!pool.length) continue;
      const start = variantShift % pool.length;
      for (let k = 0; k < pool.length; k++) {
        const c = pool[(start + k) % pool.length];
        if (usedIds.has(c.product.id)) continue;
        const isBad = c.product.section === 'bad';
        const per100 = isBad
          ? (productNutrientPerBase(c.product.id, worst.n.id) / 100)
          : productNutrientPerBase(c.product.id, worst.n.id);
        if (per100 <= 0) continue;
        const target = worst.shortage * 1.08;
        let g;
        if (isBad) {
          g = Math.max(1, Math.ceil(target / per100));
        } else {
          g = Math.ceil((target / per100) * 100);
          g = Math.max(g, 20);
          g = Math.ceil(g / 10) * 10;
        }
        const maxG = maxPortionForProduct(c.product);
        if (g > maxG) {
          if (!isBad && maxG >= 20) {
            const help = amountInPortion(c.product, worst.n.id, maxG);
            if (help < worst.shortage * 0.08) continue;
            g = maxG;
          } else if (isBad) {
            const help = amountInPortion(c.product, worst.n.id, maxG);
            if (help < worst.shortage * 0.05) continue;
            g = maxG;
          } else {
            continue;
          }
        }
        chosen = c.product;
        grams = g;
        break outer;
      }
    }
    if (!chosen) {
      skippedNutrientIds.add(worst.n.id);
      continue;
    }
    for (const n of nutrientById.values()) {
      const add = amountInPortion(chosen, n.id, grams);
      if (add) totals.set(n.id, (totals.get(n.id) || 0) + add);
    }
    usedIds.add(chosen.id);
    added.push({ product: chosen, grams, forNutrient: worst.n.name });
    if (added.length >= 16) break;
  }
  return { added, totals };
}

function isLayoutComplete(totals, duration) {
  return shortagesForDuration(totals, duration)
    .filter((g) => g.fillable)
    .every((g) => g.pct >= LAYOUT_COMPLETE_RATIO * 100);
}

const LAYOUT_EXCLUDE_KEY = 'dietolog_layout_exclude_ids';

function loadLayoutExcludeIds() {
  try {
    const raw = sessionStorage.getItem(LAYOUT_EXCLUDE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set((Array.isArray(arr) ? arr : []).map(Number).filter((n) => n > 0));
  } catch (e) {
    return new Set();
  }
}

function saveLayoutExcludeIds(ids) {
  try {
    sessionStorage.setItem(LAYOUT_EXCLUDE_KEY, JSON.stringify([...ids]));
  } catch (e) { /* ignore */ }
}

function buildLayoutItemsParam(parts) {
  // parts: [{product, grams}, ...]
  const map = new Map();
  for (const row of parts) {
    if (!row || !row.product) continue;
    const id = row.product.id;
    const g = Number(row.grams) || 0;
    if (g <= 0) continue;
    map.set(id, (map.get(id) || 0) + g);
  }
  return [...map.entries()]
    .map(([id, g]) => 'id:' + id + ':' + g)
    .join(',');
}

function renderLayoutMode(panel, itemsRaw) {
  if (!matchIndex.length) buildMatchIndex();
  if (!String(itemsRaw || '').trim()) {
    panel.innerHTML =
      '<section class="mode-card"><h2>Анализ раскладки</h2>' +
      '<p class="err">Нет параметра <code>items</code> или <code>layout</code>.</p>' +
      '<p class="mode-note">Пример: <code>?mode=layout&amp;items=' +
      escapeHtml(exampleLayoutParam()) + '</code></p></section>';
    return;
  }
  const parsed = parseLayoutItems(itemsRaw);
  const matched = parsed.map((row) => {
    const m = findProductByName(row.original);
    return {
      original: row.original,
      grams: row.grams,
      product: m.product,
      score: m.score,
    };
  });

  const totals = accumulateLayout(matched);
  const { duration, durationNutrient, durationAll, durationNutrientAll } = analyzeDuration(totals);
  const gaps = shortagesForDuration(totals, duration);

  const exampleSpecs = [
    { shift: 0, preferBad: false, label: '' },
    { shift: 1, preferBad: false, label: '' },
    { shift: 0, preferBad: true, label: ' (с БАД)' },
  ];

  panel.innerHTML = '';
  const box = document.createElement('section');
  box.className = 'mode-card';

  let html = '<h2>Анализ раскладки продуктов</h2>';
  html += '<p class="mode-note">Практическая длительность по <b>макросам</b>' +
    (durationNutrient ? (' («' + escapeHtml(durationNutrient.name) + '»)') : '') +
    ': <b>~' + duration.toFixed(2) + ' сут.</b>';
  if (durationNutrientAll && durationAll > duration * 1.15) {
    html += ' Абсолютный максимум по базе — «' + escapeHtml(durationNutrientAll.name) +
      '» (~' + durationAll.toFixed(2) + ' сут.); для добора рациона берём срок по макросам.';
  }
  html += ' Остальные нутриенты — с дефицитом на практический срок.</p>';

  html += '<h3>Ваша раскладка</h3><table class="mode-table"><thead><tr>' +
    '<th>В ссылке</th><th>Найдено в базе</th><th>Кол-во</th><th>совпад.</th></tr></thead><tbody>';
  for (const it of matched) {
    html += '<tr><td><code>' + escapeHtml(it.original) + '</code></td><td>' +
      (it.product
        ? escapeHtml(it.product.name) + (it.product.section === 'bad' ? ' <span class="badge-bad">БАД</span>' : '')
        : '<span class="miss">не найдено</span>') +
      '</td><td class="num">' + it.grams + (it.product && it.product.section === 'bad' ? ' шт.' : ' г') +
      '</td><td class="num">' + (it.product ? Math.round(it.score) : '—') + '</td></tr>';
  }
  html += '</tbody></table>';

  html += '<h3>Нутриенты на срок ~' + duration.toFixed(2) + ' сут.</h3>';
  html += '<table class="mode-table"><thead><tr><th>Нутриент</th><th>Есть</th><th>Нужно</th><th>Норма/сут</th><th>Дефицит</th><th>%</th></tr></thead><tbody>';
  for (const g of gaps) {
    const cls = g.pct >= LAYOUT_COMPLETE_RATIO * 100 ? 'ok' : (g.pct >= 50 ? 'warn' : 'bad');
    html += '<tr class="' + cls + '"><td>' + escapeHtml(g.n.name) + '</td>' +
      '<td class="num">' + escapeHtml(formatValue(g.have, g.n.units)) + '</td>' +
      '<td class="num">' + escapeHtml(formatValue(g.need, g.n.units)) + '</td>' +
      '<td class="num">' + escapeHtml(formatValue(g.daily, g.n.units)) + '</td>' +
      '<td class="num">' + escapeHtml(formatValue(g.shortage, g.n.units)) + '</td>' +
      '<td class="num">' + g.pct.toFixed(0) + '%</td></tr>';
  }
  html += '</tbody></table>';

  html += '<div id="recSection"></div>';
  html += '<div id="examplesSection"></div>';

  html += '<p class="mode-note"><b>Формат параметра items/layout:</b> ' +
    '<code>latin_slug:grams</code> · JSON · <code>id:N:g</code> (для БАД — шт.). ' +
    'Демо-ссылка без БАД в URL; примеры 1–2 без БАД, пример 3 — с БАДами.</p>';

  box.innerHTML = html;
  panel.appendChild(box);

  const recMount = box.querySelector('#recSection');
  const examplesMount = box.querySelector('#examplesSection');

  function renderExamples(exIds) {
    const examples = exampleSpecs.map((spec) => {
      const r = recommendAdditions(totals, duration, spec.shift, {
        preferBad: spec.preferBad,
        excludeIds: exIds,
      });
      return {
        label: spec.label,
        items: matched.filter((x) => x.product).map((x) => ({ product: x.product, grams: x.grams }))
          .concat(r.added.map((a) => ({ product: a.product, grams: a.grams }))),
        complete: isLayoutComplete(r.totals, duration),
      };
    });
    let ehtml = '<h3>Примеры более полных раскладок</h3>';
    ehtml += '<p class="mode-note">Примеры <b>1</b> и <b>2</b> — только продукты (как раньше); ' +
      'пример <b>3</b> — с несколькими БАДами. Исключённые из рекомендаций сюда тоже не попадают.</p>';
    examples.forEach((ex, i) => {
      ehtml += '<div class="example-block"><h4>Пример ' + (i + 1) + escapeHtml(ex.label || '') +
        (ex.complete ? ' <span class="pill ok">полный</span>' : ' <span class="pill warn">частичный</span>') +
        '</h4><ul class="example-list">';
      for (const it of ex.items) {
        ehtml += '<li>' + escapeHtml(it.product.name) + ' — <b>' + it.grams +
          (it.product.section === 'bad' ? ' шт.' : ' г') + '</b></li>';
      }
      ehtml += '</ul></div>';
    });
    examplesMount.innerHTML = ehtml;
  }

  function renderRecommendations() {
    const exIds = loadLayoutExcludeIds();
    const rec = recommendAdditions(totals, duration, 0, { preferBad: false, excludeIds: exIds });
    let rhtml = '<div class="rec-head">' +
      '<h3 class="rec-title">Рекомендуется добавить</h3>' +
      '<button type="button" class="btn-new-list" id="btnNewList" title="Старая раскладка + отмеченные рекомендации">' +
      'Создать новый список</button></div>';
    rhtml += '<p class="mode-note">Отметьте нужные продукты галочкой, затем нажмите «Создать новый список». ' +
      'Корзина — убрать из рекомендаций и подобрать другое (больше не предлагать).</p>';

    if (exIds.size) {
      rhtml += '<div class="exclude-bar"><span class="exclude-label">Не предлагать снова:</span> ';
      for (const id of exIds) {
        const p = productsCache.find((x) => x.id === id);
        const name = p ? p.name : ('#' + id);
        rhtml += '<button type="button" class="exclude-chip" data-restore-id="' + id + '" title="Вернуть в рекомендации">' +
          escapeHtml(name) + ' ×</button>';
      }
      rhtml += '<button type="button" class="exclude-clear" id="btnClearExclude">очистить</button></div>';
    }

    if (!rec.added.length) {
      rhtml += '<p class="mode-note">Раскладка уже достаточно полная на этот срок (или нечего подобрать после исключений).</p>';
    } else {
      rhtml += '<table class="mode-table rec-table"><thead><tr>' +
        '<th class="col-check"></th><th>Продукт</th><th>Кол-во</th><th>Закрывает</th><th class="col-del"></th>' +
        '</tr></thead><tbody>';
      for (const a of rec.added) {
        const unit = a.product.section === 'bad' ? ' шт.' : ' г';
        rhtml += '<tr data-pid="' + a.product.id + '" data-grams="' + a.grams + '">' +
          '<td class="col-check"><input type="checkbox" class="rec-check" aria-label="Выбрать" /></td>' +
          '<td>' + escapeHtml(a.product.name) +
          (a.product.section === 'bad' ? ' <span class="badge-bad">БАД</span>' : '') + '</td>' +
          '<td class="num">' + a.grams + unit + '</td>' +
          '<td>' + escapeHtml(a.forNutrient) + '</td>' +
          '<td class="col-del"><button type="button" class="btn-trash" title="Удалить и подобрать другое" ' +
          'aria-label="Удалить">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
          'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
          '<line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>' +
          '</svg></button></td></tr>';
      }
      rhtml += '</tbody></table>';
    }
    recMount.innerHTML = rhtml;

    recMount.querySelectorAll('.btn-trash').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tr = btn.closest('tr');
        const pid = Number(tr && tr.getAttribute('data-pid'));
        if (!pid) return;
        const next = loadLayoutExcludeIds();
        next.add(pid);
        saveLayoutExcludeIds(next);
        renderRecommendations();
        renderExamples(next);
      });
    });

    recMount.querySelectorAll('.exclude-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const id = Number(chip.getAttribute('data-restore-id'));
        const next = loadLayoutExcludeIds();
        next.delete(id);
        saveLayoutExcludeIds(next);
        renderRecommendations();
        renderExamples(next);
      });
    });

    const clearBtn = recMount.querySelector('#btnClearExclude');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        saveLayoutExcludeIds(new Set());
        renderRecommendations();
        renderExamples(new Set());
      });
    }

    const newBtn = recMount.querySelector('#btnNewList');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        const baseParts = matched
          .filter((x) => x.product)
          .map((x) => ({ product: x.product, grams: x.grams }));
        const checked = [];
        recMount.querySelectorAll('tr[data-pid]').forEach((tr) => {
          const cb = tr.querySelector('.rec-check');
          if (cb && cb.checked) {
            checked.push({
              product: productsCache.find((p) => p.id === Number(tr.getAttribute('data-pid'))),
              grams: Number(tr.getAttribute('data-grams')),
            });
          }
        });
        if (!checked.length) {
          alert('Отметьте галочкой хотя бы один продукт из рекомендаций, чтобы добавить его в новый список.');
          return;
        }
        const items = buildLayoutItemsParam(baseParts.concat(checked));
        const url = pageBaseUrl() + '?mode=layout&items=' + encodeURIComponent(items);
        location.assign(url);
      });
    }

    renderExamples(exIds);
  }

  renderRecommendations();
}

function findBadProductByTitle(substr) {
  const s = String(substr || '').toLowerCase();
  return productsCache.find((p) => p.section === 'bad' && p.nameLower.includes(s)) || null;
}

function exampleLayoutParam() {
  // Original demo URL (foods only) — do not put BADs in the example link.
  return 'yajco_kurinoe_celoe:100,grechiha_zerno:150,moloko_suhoe_1:40,krupa_risovaya:100';
}

function renderDefaultModeLinks(panel) {
  const base = pageBaseUrl();
  const urlNutrients = base + '?mode=nutrients';
  const urlLayout = base + '?mode=layout&items=' + encodeURIComponent(exampleLayoutParam());
  panel.innerHTML =
    '<section class="mode-card mode-links">' +
    '<h2>Режимы по ссылке (GET)</h2>' +
    '<p class="mode-note">Опубликованная страница: можно открывать с параметрами.</p>' +
    '<ol class="mode-ol">' +
    '<li><b>Нутриенты → главные продукты:</b><br/>' +
    '<a href="' + escapeHtml(urlNutrients) + '">' + escapeHtml(urlNutrients) + '</a></li>' +
    '<li><b>Анализ раскладки (пример):</b><br/>' +
    '<a href="' + escapeHtml(urlLayout) + '">' + escapeHtml(urlLayout) + '</a><br/>' +
    '<span class="mode-note">Параметр <code>items</code> (или <code>layout</code>): продукты (латиница <code>slug:g</code>). ' +
    'В анализе: примеры 1–2 без БАД; пример <b>3 — с БАДами</b>. Демо URL: ' +
    '<code>' + escapeHtml(exampleLayoutParam()) + '</code></span></li>' +
    '</ol>' +
    '<p class="mode-note">Ниже — обычный просмотр: поиск → группа → продукт → нутриенты.</p>' +
    '</section>';
}

function applyModeUi(query) {
  const panel = document.getElementById('modePanel');
  const lead = document.getElementById('leadText');
  const toolbar = document.getElementById('toolbar');
  if (!panel) return;

  if (query.mode === 'nutrients') {
    if (lead) lead.innerHTML = 'Режим: <b>нутриенты</b> → топ продуктов по содержанию и % суточной нормы. Ниже — полный список продуктов.';
    renderNutrientsMode(panel);
    if (toolbar) toolbar.style.display = '';
  } else if (query.mode === 'layout') {
    if (lead) lead.innerHTML = 'Режим: <b>анализ раскладки</b> из GET-параметра. Ниже — справочник продуктов.';
    renderLayoutMode(panel, query.itemsRaw);
    if (toolbar) toolbar.style.display = '';
  } else {
    if (lead) lead.innerHTML = 'Поиск → <b>группа</b> → продукт → нутриенты. Все БАДы в одной группе <b>БАД</b>.';
    renderDefaultModeLinks(panel);
    if (toolbar) toolbar.style.display = '';
  }
}
