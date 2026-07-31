/* === GET modes (v11) — injected into dietolog.html ===
 *
 * mode=nutrients  — list nutrients; expand → top TOP_N products with amount + % of daily min
 * mode=layout&items=slug:grams,slug:grams&days=1[&fastdegree=…][&trail=1]
 *   or ?layout=slug:grams,...
 *   items may also be JSON: [{"n":"slug","g":100},{"n":"id:193","g":50}]
 *   days|time — target duration in days (default 1). If set, items may omit quantity:
 *     items=egg,buckwheat&days=3 → quantities are auto-sized for that period.
 *   fastdegree|fast|post — степень поста (по умолчанию не задана = всё разрешено):
 *     сухоядение | до масла | до рыбы | скоромное
 *     (aliases: dry/strict, oil, fish, meat/none)
 *   trail|istrail|hike — 1/true: только продукты с istrail (походный запас); по умолчанию выкл.
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
const LAYOUT_DEFAULT_DAYS = 1;
const SPICE_NAME_RE = /сушен|молот(ый|ая|ое)|специ|перец\b|базилик|гвоздик|кориц|кардамон|куркум|орегано|тимьян|мята\b|лавровый|майоран|фенхель|имбирь|шалфей|укроп суш|петрушка суш|кориандр|\bсоль\b/i;

/** Orthodox fasting scale (stricter → milder). Product allowed if its rank ≤ day rank. */
const FAST_DEGREE_RANK = {
  'сухоядение': 0,
  'до масла': 1,
  'до рыбы': 2,
  'скоромное': 3,
};
const FAST_DEGREE_OPTIONS = [
  { value: '', label: 'Всё' },
  { value: 'скоромное', label: 'Скоромное' },
  { value: 'до рыбы', label: 'До рыбы' },
  { value: 'до масла', label: 'До масла' },
  { value: 'сухоядение', label: 'Сухоядение' },
];

function normalizeFastDegree(raw) {
  if (raw == null) return null;
  let s = String(raw).trim().toLowerCase().replace(/_/g, ' ').replace(/\+/g, ' ');
  if (!s || s === 'all' || s === 'any' || s === 'всё' || s === 'все' || s === 'none') return null;
  const aliases = {
    'сухоядение': 'сухоядение',
    'dry': 'сухоядение',
    'strict': 'сухоядение',
    'strictfast': 'сухоядение',
    'до масла': 'до масла',
    'масло': 'до масла',
    'oil': 'до масла',
    'wineandoil': 'до масла',
    'до рыбы': 'до рыбы',
    'рыба': 'до рыбы',
    'fish': 'до рыбы',
    'скоромное': 'скоромное',
    'meat': 'скоромное',
    'dairy': 'скоромное',
    'nofast': 'скоромное',
    'crown': 'скоромное',
  };
  if (aliases[s]) return aliases[s];
  s = s.replace(/\s+/g, ' ');
  return aliases[s] || (Object.prototype.hasOwnProperty.call(FAST_DEGREE_RANK, s) ? s : null);
}

function productAllowedForFast(product, fastDegree) {
  if (!fastDegree) return true;
  if (!product) return true;
  if (product.section === 'bad' || product.group === 'БАД') return true;
  const fd = String(product.fastdegree || '');
  if (!fd || fd === 'БАД' || fd.indexOf('БАД') === 0) return true;
  const dayRank = FAST_DEGREE_RANK[fastDegree];
  const prodRank = FAST_DEGREE_RANK[fd];
  if (dayRank == null) return true;
  if (prodRank == null) return true;
  return prodRank <= dayRank;
}

function parseTrailFlag(raw) {
  if (raw == null) return false;
  const s = String(raw).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on' || s === 'да';
}

function productAllowedForTrail(product, trailOnly) {
  if (!trailOnly) return true;
  if (!product) return true;
  return !!product.istrail;
}

function fastDegreeLabel(fastDegree) {
  if (!fastDegree) return 'Всё';
  const opt = FAST_DEGREE_OPTIONS.find((o) => o.value === fastDegree);
  return opt ? opt.label : fastDegree;
}

function parseQuery() {
  const sp = new URLSearchParams(location.search);
  let mode = (sp.get('mode') || '').trim().toLowerCase();
  const nutrientsFlag = sp.get('nutrients');
  const layoutRaw = sp.get('layout');
  const itemsRaw = sp.get('items');
  if (!mode && (nutrientsFlag === '1' || nutrientsFlag === 'true')) mode = 'nutrients';
  if (!mode && (layoutRaw || itemsRaw)) mode = 'layout';
  if (!mode) mode = 'browse';
  const daysRaw = sp.get('days') || sp.get('time') || sp.get('d');
  let days = null;
  if (daysRaw != null && String(daysRaw).trim() !== '') {
    const n = Number(String(daysRaw).trim().replace(',', '.'));
    if (n > 0 && Number.isFinite(n)) days = n;
  }
  const fastRaw = sp.get('fastdegree') || sp.get('fast') || sp.get('post');
  const trailRaw = sp.get('trail') || sp.get('istrail') || sp.get('hike');
  return {
    mode,
    itemsRaw: itemsRaw || layoutRaw || '',
    days,
    fastdegree: normalizeFastDegree(fastRaw),
    trail: parseTrailFlag(trailRaw),
  };
}

function pageBaseUrl() {
  // strip query/hash; keep path to this html
  return location.href.split('#')[0].split('?')[0];
}

function layoutUrl(itemsParam, days, fastdegree, trailOnly) {
  let url = pageBaseUrl() + '?mode=layout&items=' + encodeURIComponent(itemsParam);
  const d = Number(days);
  if (d > 0 && Number.isFinite(d)) {
    url += '&days=' + encodeURIComponent(String(d));
  }
  const fd = normalizeFastDegree(fastdegree);
  if (fd) {
    url += '&fastdegree=' + encodeURIComponent(fd);
  }
  if (trailOnly) {
    url += '&trail=1';
  }
  return url;
}

/** Update browser address bar without navigation (works offline). */
function replaceLayoutUrl(itemsParam, days, fastdegree, trailOnly) {
  const url = layoutUrl(itemsParam, days, fastdegree, trailOnly);
  try {
    history.replaceState(null, '', url);
  } catch (e) { /* file:// or restricted */ }
  return url;
}

function syncTrailCheckbox(trailOnly) {
  const el = document.getElementById('trailOnly');
  if (el) el.checked = !!trailOnly;
}

function browseUrl(trailOnly) {
  let url = pageBaseUrl();
  if (trailOnly) url += (url.indexOf('?') >= 0 ? '&' : '?') + 'trail=1';
  return url;
}

function replaceBrowseUrl(trailOnly) {
  const url = browseUrl(trailOnly);
  try {
    history.replaceState(null, '', url);
  } catch (e) { /* file:// */ }
  return url;
}

/** Raw file on GitHub Pages branch — full HTML with embedded SEED. */
const OFFLINE_RAW_URL =
  'https://raw.githubusercontent.com/RobinZGit/dietolog_client/gh-pages/dietolog.html';

function formatSeedSizeHint() {
  try {
    const approx = JSON.stringify(SEED).length;
    if (approx >= 1024 * 1024) {
      return (approx / (1024 * 1024)).toFixed(1).replace('.', ',') + ' МБ';
    }
    return Math.max(1, Math.round(approx / 1024)) + ' КБ';
  } catch (e) {
    return '0,5 МБ';
  }
}

async function downloadOfflineHtml() {
  const btn = document.getElementById('btnDownloadOffline');
  if (btn) btn.disabled = true;
  try {
    let text = null;
    try {
      const r = await fetch(pageBaseUrl(), { cache: 'no-store' });
      if (r.ok) text = await r.text();
    } catch (e) { /* file:// */ }
    if (!text || text.indexOf('const SEED') < 0) {
      text = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    }
    const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dietolog-v' + SEED.version + '-offline.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => {
      try { URL.revokeObjectURL(url); } catch (e2) { /* ignore */ }
    }, 2500);
  } catch (e) {
    window.open(OFFLINE_RAW_URL, '_blank');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function wireOfflineDownload() {
  const note = document.getElementById('offlineNote');
  if (note) {
    note.innerHTML =
      'Вся база продуктов уже <b>внутри этого HTML</b> (~' +
      escapeHtml(formatSeedSizeHint()) + ', v' + SEED.version + ', ' +
      SEED.products.length +
      ' продуктов). Вся БД внутри этого HTML — отдельный seed.json не нужен. ' +
      'Android / планшет: скачать → открыть файл в Chrome. ' +
      '<a href="' + OFFLINE_RAW_URL + '" download="dietolog-offline.html">' +
      'Прямая ссылка на файл</a>.';
  }
  const btn = document.getElementById('btnDownloadOffline');
  if (btn && !btn.getAttribute('data-wired')) {
    btn.setAttribute('data-wired', '1');
    btn.addEventListener('click', () => { downloadOfflineHtml(); });
  }
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
 *  - slug (no qty) → auto quantity when days is set
 *  - id:N / id:N:qty
 *  - JSON array [{n|name|id, g|grams|q|qty}]
 */
function parseLayoutItems(raw) {
  const text = String(raw || '').trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    try {
      const arr = JSON.parse(text);
      return arr.map((row) => {
        const original = String(row.n || row.name || (row.id != null ? 'id:' + row.id : '') || '');
        const hasQty = row.g != null || row.grams != null || row.q != null || row.qty != null;
        const grams = hasQty ? Number(row.g || row.grams || row.q || row.qty || 0) : 0;
        return {
          original,
          grams: hasQty && grams > 0 ? grams : 0,
          auto: !hasQty || !(grams > 0),
        };
      }).filter((x) => x.original);
    } catch (e) {
      console.warn('layout JSON parse failed', e);
    }
  }
  return text.split(/[,;|]+/).map((part) => {
    const p = part.trim();
    if (!p) return null;
    let m = /^id[:#]?(\d+)[=:](\d+(?:\.\d+)?)$/i.exec(p);
    if (m) return { original: 'id:' + m[1], grams: Number(m[2]), auto: false };
    m = /^id[:#]?(\d+)$/i.exec(p);
    if (m) return { original: 'id:' + m[1], grams: 0, auto: true };
    m = /^#(\d+)[=:](\d+(?:\.\d+)?)$/.exec(p);
    if (m) return { original: 'id:' + m[1], grams: Number(m[2]), auto: false };
    m = /^#(\d+)$/.exec(p);
    if (m) return { original: 'id:' + m[1], grams: 0, auto: true };
    m = /^(.+?)[=:](\d+(?:\.\d+)?)$/.exec(p);
    if (m) return { original: m[1].trim(), grams: Number(m[2]), auto: false };
    return { original: p, grams: 0, auto: true };
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
  const trailOnly = typeof trailFilterOn === 'function' ? trailFilterOn() : false;
  const rows = [];
  for (const p of productsCache) {
    if (trailOnly && !p.istrail) continue;
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
    if (!it.product || !(it.grams > 0)) continue;
    for (const n of nutrientById.values()) {
      const add = amountInPortion(it.product, n.id, it.grams);
      if (add) totals.set(n.id, (totals.get(n.id) || 0) + add);
    }
  }
  return totals;
}

/**
 * When quantity omitted (auto) and target days known — pick amounts from listed products
 * to cover calorie need for the period (split evenly), then recommendations fill the rest.
 */
function autoSizeLayoutPortions(matched, targetDays) {
  const days = Math.max(LAYOUT_DEFAULT_DAYS, Number(targetDays) || LAYOUT_DEFAULT_DAYS);
  const result = matched.map((m) => ({
    ...m,
    grams: m.auto ? 0 : (Number(m.grams) || 0),
    autoSized: false,
  }));
  const autos = result.filter((r) => r.product && r.auto);
  if (!autos.length) return result;

  const fixed = result.filter((r) => r.product && !r.auto && r.grams > 0);
  const totals = accumulateLayout(fixed);
  const calorieN = [...nutrientById.values()].find((n) => /^Калорийность$/i.test(String(n.name)));
  const calDaily = calorieN ? nutrientMin(calorieN) : 2500;
  const calNeed = days * calDaily;
  const calHave = calorieN ? (totals.get(calorieN.id) || 0) : 0;
  let calLeft = Math.max(0, calNeed - calHave);

  const dens = [];
  for (const a of autos) {
    const sampleG = a.product.section === 'bad' ? 1 : 100;
    const kcal = calorieN ? amountInPortion(a.product, calorieN.id, sampleG) : 0;
    const kcalPerUnit = a.product.section === 'bad' ? kcal : (kcal / 100);
    dens.push({ row: a, kcalPerUnit });
  }
  const withCal = dens.filter((d) => d.kcalPerUnit > 0);
  const share = withCal.length ? calLeft / withCal.length : 0;
  for (const d of withCal) {
    let g;
    if (d.row.product.section === 'bad') {
      g = Math.max(1, Math.ceil(share / d.kcalPerUnit));
      g = Math.min(g, Math.max(1, Math.ceil(days)) * maxPortionForProduct(d.row.product));
    } else {
      g = Math.ceil(share / d.kcalPerUnit);
      g = Math.max(40, Math.ceil(g / 10) * 10);
      g = Math.min(g, Math.ceil(days) * maxPortionForProduct(d.row.product));
      g = Math.min(g, Math.ceil(days) * 300);
    }
    d.row.grams = g;
    d.row.autoSized = true;
  }
  for (const a of autos) {
    if (!(a.grams > 0)) {
      a.grams = a.product.section === 'bad'
        ? Math.max(1, Math.ceil(days))
        : Math.min(Math.ceil(days) * 100, Math.ceil(days) * maxPortionForProduct(a.product));
      a.autoSized = true;
    }
  }
  return result;
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
  // Salt: ~10–15 g/day is enough to cover Na/Cl norms; spices stay tiny.
  if (/соль\s+(поварен|морск)|йодированн.*(соль)|соль.*йод/i.test(product.name) ||
      /^соль\b/i.test(product.name)) {
    return 15;
  }
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
 * options.fastdegree = string|null — Orthodox fasting day allowance
 * options.trailOnly = boolean — only istrail products
 */
function recommendAdditions(baseTotals, duration, variantShift, options) {
  const preferBad = !!(options && options.preferBad);
  const fastDegree = normalizeFastDegree(options && options.fastdegree);
  const trailOnly = !!(options && options.trailOnly);
  const totals = cloneTotals(baseTotals);
  const added = [];
  const usedIds = new Set();
  const usedFamilies = new Set();
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

    const ranked = topProductsForNutrient(worst.n.id, 80)
      .filter((r) => productAllowedForFast(r.product, fastDegree))
      .filter((r) => productAllowedForTrail(r.product, trailOnly));
    const badCandidates = ranked.filter((r) => r.product.section === 'bad');
    const foodCandidates = ranked.filter((r) => r.product.section !== 'bad');
    // foods only OR foods first + BADs for leftover gaps («немного БАД» in example 3)
    const pools = preferBad ? [foodCandidates, badCandidates] : [foodCandidates];

    let chosen = null;
    let grams = 0;
    // Prefer a different family than already recommended (analogues → one from group).
    const tryPools = (preferNewFamily) => {
      for (const pool of pools) {
        if (!pool.length) continue;
        const start = variantShift % pool.length;
        for (let k = 0; k < pool.length; k++) {
          const c = pool[(start + k) % pool.length];
          if (usedIds.has(c.product.id)) continue;
          const fam = productFamily(c.product);
          if (preferNewFamily && usedFamilies.has(fam) && c.product.section !== 'bad') continue;
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
            const maxG0 = maxPortionForProduct(c.product);
            g = Math.ceil((target / per100) * 100);
            const minG = Math.min(20, maxG0);
            g = Math.max(g, minG);
            if (maxG0 >= 10) g = Math.ceil(g / 10) * 10;
            else g = Math.max(1, Math.round(g));
          }
          const maxG = maxPortionForProduct(c.product);
          if (g > maxG) {
            if (!isBad && maxG >= 5) {
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
          return { product: c.product, grams: g, family: fam };
        }
      }
      return null;
    };
    let pick = tryPools(true) || tryPools(false);
    if (!pick) {
      skippedNutrientIds.add(worst.n.id);
      continue;
    }
    chosen = pick.product;
    grams = pick.grams;
    for (const n of nutrientById.values()) {
      const add = amountInPortion(chosen, n.id, grams);
      if (add) totals.set(n.id, (totals.get(n.id) || 0) + add);
    }
    usedIds.add(chosen.id);
    usedFamilies.add(pick.family);
    added.push({
      product: chosen,
      grams,
      forNutrient: worst.n.name,
      forNutrientId: worst.n.id,
      originalId: chosen.id,
    });
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

/** Recommendation row overrides: originalPid → replacementPid */
const REC_OVERRIDE_KEY = 'dietolog_rec_analog_overrides';

function loadRecOverrides() {
  try {
    const raw = sessionStorage.getItem(REC_OVERRIDE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : {};
  } catch (e) {
    return {};
  }
}

function saveRecOverrides(map) {
  try {
    sessionStorage.setItem(REC_OVERRIDE_KEY, JSON.stringify(map || {}));
  } catch (e) { /* ignore */ }
}

/** Coarse food family for diversifying analogues (oats vs oatmeal stay related). */
function productFamily(product) {
  const n = String(product && product.name || '').toLowerCase().replace(/ё/g, 'е');
  const rules = [
    [/греч/, 'греча'],
    [/ов[еe]с|овсян|геркулес|толокно/, 'овес'],
    [/рис\b|рисово|рисовая/, 'рис'],
    [/пшен(?!иц)/, 'пшено'],
    [/перлов|ячмен/, 'ячмень'],
    [/пшениц|манн|булгур|кускус|спельт/, 'пшеница'],
    [/кукуруз|маис|попкорн/, 'кукуруза'],
    [/картоф|чипсы/, 'картофель'],
    [/морков/, 'морковь'],
    [/капуст|броккол|цветн/, 'капуста'],
    [/фасол|нут|чечевиц|горох|со[еи]|тофу|темпе/, 'бобовые'],
    [/грецк|миндал|кешью|фундук|арахис|семена|тыкв.*семен|подсолнеч/, 'орехи'],
    [/курага|изюм|чернослив|финик|сушен.*(яблок|груш|персик|слив)/, 'сухофрукты'],
    [/яйц/, 'яйца'],
    [/говяд|телен|телятин/, 'говядина'],
    [/свинин|бекон|шпик|сало/, 'свинина'],
    [/курин|куриц|цыплен|индейк/, 'птица'],
    [/рыб|треск|лосос|сельдь|минтай|скумбр|лещ/, 'рыба'],
    [/сыр\b|творог|кефир|йогурт|молоко|сливки/, 'молочка'],
    [/масло|маргарин|жир\b/, 'жиры'],
    [/шоколад|халва|карамель|печенье|вафл|конфет/, 'сладости'],
    [/соль|перец|специ|паприка|кориц/, 'специи'],
  ];
  for (const [re, fam] of rules) {
    if (re.test(n)) return fam;
  }
  return (product.group || 'прочее').toLowerCase();
}

/**
 * Bring nutrient amounts to grams so мг/мкг/г are comparable.
 * кКал → «граммовый» эквивалент энергии (≈4 ккал/г, как у углеводов).
 */
function nutrientAmountInGrams(value, units) {
  const v = Number(value) || 0;
  const u = String(units || '').trim();
  if (u === 'г') return v;
  if (u === 'мг') return v * 1e-3;
  if (u === 'мкг') return v * 1e-6;
  if (/ккал/i.test(u)) return v / 4;
  return v;
}

/**
 * Composition vector for analogue similarity:
 * 1) convert to grams, 2) divide by daily min (also in grams)
 * → «доля суточной нормы на 100 г». Then cosine compares shapes fairly:
 * protein 0 vs 21 g matters, and mg-minerals no longer drown macros.
 */
function nutrientVector(productId) {
  const items = infoCache.get(productId) || [];
  const vec = new Map();
  for (const [nid, val] of items) {
    const v = Number(val) || 0;
    if (v <= 0) continue;
    const n = nutrientById.get(nid);
    if (!n) continue;
    const grams = nutrientAmountInGrams(v, n.units);
    const dailyG = nutrientAmountInGrams(Number(n.min) || 0, n.units);
    const w = dailyG > 0 ? grams / dailyG : grams;
    if (w > 0) vec.set(nid, w);
  }
  return vec;
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA.size || !vecB.size) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [k, va] of vecA) {
    na += va * va;
    const vb = vecB.get(k);
    if (vb) dot += va * vb;
  }
  for (const vb of vecB.values()) nb += vb * vb;
  if (na <= 0 || nb <= 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Analogues of a recommended product: close by composition / group,
 * but diversified by family so the list is not 5 near-duplicates.
 * Always includes `product` itself first (default radio).
 */
function findAnalogues(product, options) {
  const opts = options || {};
  const limit = opts.limit || 7;
  const fastDegree = normalizeFastDegree(opts.fastdegree);
  const trailOnly = !!opts.trailOnly;
  const nutrientId = opts.nutrientId != null ? Number(opts.nutrientId) : null;
  const excludeIds = new Set(
    (opts.excludeIds ? [...opts.excludeIds] : []).map(Number)
  );
  excludeIds.delete(product.id);

  const baseVec = nutrientVector(product.id);
  const baseFam = productFamily(product);
  const scored = [];
  for (const p of productsCache) {
    if (p.id === product.id) continue;
    if (excludeIds.has(p.id)) continue;
    if ((p.section || 'food') !== (product.section || 'food')) continue;
    if (!productAllowedForFast(p, fastDegree)) continue;
    if (!productAllowedForTrail(p, trailOnly)) continue;
    if (nutrientId != null && productNutrientPerBase(p.id, nutrientId) <= 0) continue;
    const sim = cosineSimilarity(baseVec, nutrientVector(p.id));
    const sameGroup = (p.group || '') === (product.group || '');
    // Threshold: same group can be a bit looser; otherwise need real composition match.
    if (sim < (sameGroup ? 0.35 : 0.55) && !sameGroup) continue;
    if (sim < 0.25) continue;
    let score = sim + (sameGroup ? 0.12 : 0);
    // Prefer same family as a close analogue, but not exclusively.
    const fam = productFamily(p);
    if (fam === baseFam) score += 0.08;
    scored.push({ product: p, sim, score, family: fam });
  }
  scored.sort((a, b) => b.score - a.score);

  const picked = [{ product: product, sim: 1, score: 1, family: baseFam, isOriginal: true }];
  const usedFamilies = new Set([baseFam]);
  // First pass: one close same-family option (e.g. oatmeal next to oat grain).
  for (const c of scored) {
    if (c.family === baseFam) {
      picked.push({ ...c, isOriginal: false });
      break;
    }
  }
  // Second pass: diversify — different families.
  for (const c of scored) {
    if (picked.length >= limit) break;
    if (picked.some((x) => x.product.id === c.product.id)) continue;
    if (usedFamilies.has(c.family)) continue;
    picked.push({ ...c, isOriginal: false });
    usedFamilies.add(c.family);
  }
  // Fill if still short (allow another from known families with lower priority).
  for (const c of scored) {
    if (picked.length >= limit) break;
    if (picked.some((x) => x.product.id === c.product.id)) continue;
    picked.push({ ...c, isOriginal: false });
  }
  return picked;
}

function nutrientIdByName(name) {
  const s = String(name || '').toLowerCase();
  for (const n of nutrientById.values()) {
    if (String(n.name).toLowerCase() === s) return n.id;
  }
  return null;
}

/** Recalculate portion so analogue ≈ same amount of key nutrient as original portion. */
function gramsMatchingNutrient(origProduct, origGrams, newProduct, nutrientId) {
  if (!newProduct) return origGrams;
  if (nutrientId == null) return origGrams;
  const want = amountInPortion(origProduct, nutrientId, origGrams);
  if (!(want > 0)) return origGrams;
  const isBad = newProduct.section === 'bad';
  const per = isBad
    ? productNutrientPerBase(newProduct.id, nutrientId) / 100
    : productNutrientPerBase(newProduct.id, nutrientId) / 100;
  if (!(per > 0)) return origGrams;
  let g = want / per;
  const maxG = maxPortionForProduct(newProduct);
  if (isBad) {
    g = Math.max(1, Math.min(maxG, Math.ceil(g)));
  } else {
    g = Math.max(10, Math.min(maxG, Math.ceil(g / 10) * 10));
  }
  return g;
}

function closeAnalogModal() {
  const el = document.getElementById('analogModal');
  if (el) el.remove();
}

function openAnalogModal(opts) {
  closeAnalogModal();
  const product = opts.product;
  const grams = opts.grams;
  const nutrientName = opts.nutrientName || '';
  const nutrientId = opts.nutrientId != null ? opts.nutrientId : nutrientIdByName(nutrientName);
  const selectedId = opts.selectedId != null ? opts.selectedId : product.id;
  const analogues = findAnalogues(product, {
    fastdegree: opts.fastdegree,
    trailOnly: opts.trailOnly,
    nutrientId,
    excludeIds: opts.excludeIds,
    limit: 7,
  });
  // Ensure currently selected (after prior override) appears and is checked.
  if (selectedId !== product.id) {
    const sel = productsCache.find((p) => p.id === selectedId);
    if (sel && !analogues.some((a) => a.product.id === selectedId)) {
      analogues.splice(1, 0, {
        product: sel,
        sim: cosineSimilarity(nutrientVector(product.id), nutrientVector(sel.id)),
        family: productFamily(sel),
        isOriginal: false,
      });
    }
  }

  const overlay = document.createElement('div');
  overlay.id = 'analogModal';
  overlay.className = 'analog-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Аналоги продукта');

  let body = '<div class="analog-dialog">' +
    '<h3 class="analog-title">Аналоги</h3>' +
    '<p class="mode-note">Близкие по составу и группе; в списке — разные «семейства», чтобы не дублировать одно и то же. ' +
    'Выберите один вариант (radio).</p>' +
    '<p class="analog-orig">Исходное предложение: <b>' + escapeHtml(product.name) + '</b>' +
    (nutrientName ? (' · закрывает: ' + escapeHtml(nutrientName)) : '') +
    '</p><form class="analog-form"><div class="analog-list">';

  analogues.forEach((a) => {
    const id = 'analogOpt_' + a.product.id;
    const checked = a.product.id === selectedId ? ' checked' : '';
    const mark = a.isOriginal || a.product.id === product.id
      ? ' <span class="pill ok">предложение</span>'
      : '';
    const simPct = Math.round((a.sim || 0) * 100);
    body += '<label class="analog-option" for="' + id + '">' +
      '<input type="radio" name="analogPick" id="' + id + '" value="' + a.product.id + '"' + checked + ' />' +
      '<span class="analog-option-text">' +
      '<span class="analog-name">' + escapeHtml(a.product.name) + mark + '</span>' +
      '<span class="analog-meta">' + escapeHtml(a.product.group || '') +
      (a.product.id !== product.id ? (' · сходство ~' + simPct + '%') : '') +
      '</span></span></label>';
  });

  body += '</div><div class="analog-actions">' +
    '<button type="button" class="btn-analog-cancel" id="analogCancel">Отмена</button>' +
    '<button type="submit" class="btn-analog-ok" id="analogOk">OK</button>' +
    '</div></form></div>';

  overlay.innerHTML = body;
  document.body.appendChild(overlay);

  const finish = (replacementId) => {
    closeAnalogModal();
    if (typeof opts.onOk === 'function' && replacementId) {
      opts.onOk(Number(replacementId));
    }
  };

  overlay.querySelector('#analogCancel').addEventListener('click', () => closeAnalogModal());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAnalogModal();
  });
  const form = overlay.querySelector('.analog-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const picked = form.querySelector('input[name="analogPick"]:checked');
    if (!picked) return;
    finish(picked.value);
  });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', esc);
      closeAnalogModal();
    }
  });
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

/** Rebuild items= from matched layout rows (keeps unresolved originals). */
function buildLayoutItemsParamFromMatched(matchedRows) {
  const chunks = [];
  const seenIds = new Map();
  for (const it of matchedRows || []) {
    if (!it) continue;
    if (it.product && it.grams > 0) {
      const id = it.product.id;
      seenIds.set(id, (seenIds.get(id) || 0) + Number(it.grams));
    } else if (it.original) {
      const g = Number(it.grams);
      chunks.push(g > 0 ? (it.original + ':' + g) : String(it.original));
    }
  }
  for (const [id, g] of seenIds.entries()) {
    chunks.push('id:' + id + ':' + g);
  }
  return chunks.join(',');
}

function trashIconSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
    '<line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>' +
    '</svg>';
}

function findCalorieNutrient() {
  return [...nutrientById.values()].find((n) => /^Калорийность$/i.test(String(n.name))) || null;
}

function layoutCaloriesTotal(parts, calorieN) {
  if (!calorieN) return 0;
  let sum = 0;
  for (const row of parts) {
    if (!row || !row.product || !(row.grams > 0)) continue;
    sum += amountInPortion(row.product, calorieN.id, row.grams);
  }
  return sum;
}

/**
 * Bring total calories for the period to daily-norm × days by scaling food amounts
 * (БАД leave as-is). Returns { parts, reductions, increases, targetCal, finalCal }.
 */
function balancePartsToCalorieNorm(partsIn, targetDays) {
  const days = Math.max(LAYOUT_DEFAULT_DAYS, Number(targetDays) || LAYOUT_DEFAULT_DAYS);
  const calorieN = findCalorieNutrient();
  const daily = calorieN ? nutrientMin(calorieN) : 2500;
  const targetCal = days * daily;
  const parts = (partsIn || [])
    .filter((p) => p && p.product && p.grams > 0)
    .map((p) => ({ product: p.product, grams: Number(p.grams), before: Number(p.grams) }));

  if (!parts.length || !calorieN) {
    return { parts, reductions: [], increases: [], targetCal, finalCal: 0 };
  }

  const bad = parts.filter((p) => p.product.section === 'bad');
  const foods = parts.filter((p) => p.product.section !== 'bad');
  const badCal = layoutCaloriesTotal(bad, calorieN);
  let foodTarget = Math.max(0, targetCal - badCal);

  const roundFood = (g) => {
    const n = Math.round(Number(g) / 10) * 10;
    return Math.max(10, n);
  };

  if (foods.length && foodTarget > 0) {
    let foodCal = layoutCaloriesTotal(foods, calorieN);
    if (foodCal > 0) {
      const scale = foodTarget / foodCal;
      if (Math.abs(scale - 1) > 0.02) {
        for (const f of foods) {
          f.grams = roundFood(f.before * scale);
        }
      }
    }
    // Fine-tune if still clearly over/under target
    for (let iter = 0; iter < 40; iter++) {
      foodCal = layoutCaloriesTotal(foods, calorieN);
      const diff = foodCal - foodTarget;
      if (Math.abs(diff) <= foodTarget * 0.02) break;
      // Adjust the densest food first
      let best = null;
      let bestDens = 0;
      for (const f of foods) {
        const dens = amountInPortion(f.product, calorieN.id, 100) / 100;
        if (dens > bestDens) {
          bestDens = dens;
          best = f;
        }
      }
      if (!best || bestDens <= 0) break;
      if (diff > 0) {
        const step = Math.max(10, Math.ceil(diff / bestDens / 10) * 10);
        best.grams = Math.max(10, best.grams - step);
      } else {
        const step = Math.max(10, Math.ceil((-diff) / bestDens / 10) * 10);
        const maxG = Math.ceil(days) * maxPortionForProduct(best.product);
        best.grams = Math.min(maxG, best.grams + step);
      }
    }
  }

  const reductions = [];
  const increases = [];
  for (const f of foods) {
    const unit = 'г';
    if (f.grams < f.before - 0.5) {
      reductions.push({ name: f.product.name, from: f.before, to: f.grams, unit });
    } else if (f.grams > f.before + 0.5) {
      increases.push({ name: f.product.name, from: f.before, to: f.grams, unit });
    }
  }
  const out = foods.concat(bad).map((p) => ({ product: p.product, grams: p.grams }));
  return {
    parts: out,
    reductions,
    increases,
    targetCal,
    finalCal: layoutCaloriesTotal(out, calorieN),
  };
}

const LAYOUT_ADJUST_MSG_KEY = 'dietolog_layout_adjust_msg';

function saveLayoutAdjustMessage(msg) {
  try {
    if (msg) sessionStorage.setItem(LAYOUT_ADJUST_MSG_KEY, msg);
    else sessionStorage.removeItem(LAYOUT_ADJUST_MSG_KEY);
  } catch (e) { /* ignore */ }
}

function takeLayoutAdjustMessage() {
  try {
    const m = sessionStorage.getItem(LAYOUT_ADJUST_MSG_KEY);
    sessionStorage.removeItem(LAYOUT_ADJUST_MSG_KEY);
    return m || '';
  } catch (e) {
    return '';
  }
}

function formatAdjustMessage(reductions, increases, targetDays) {
  const daysLabel = formatDays(targetDays);
  const lines = [];
  if (reductions && reductions.length) {
    lines.push(
      'Чтобы калорийность за ' + daysLabel + ' сут. соответствовала норме, ' +
      'количества некоторых ранее выбранных продуктов уменьшены: ' +
      reductions.map((r) => r.name + ' — ' + r.from + ' ' + r.unit + ' → ' + r.to + ' ' + r.unit).join('; ') + '.'
    );
  }
  if (increases && increases.length) {
    lines.push(
      'Чтобы приблизить калорийность к норме за ' + daysLabel + ' сут., ' +
      'количества некоторых продуктов увеличены: ' +
      increases.map((r) => r.name + ' — ' + r.from + ' ' + r.unit + ' → ' + r.to + ' ' + r.unit).join('; ') + '.'
    );
  }
  return lines.join(' ');
}

/** Banner when new list only rebalances calories (no recommendation picks). */
function formatCalorieOnlyMessage(balanced, targetDays, hadAdditions) {
  const daysLabel = formatDays(targetDays);
  const parts = [];
  const adj = formatAdjustMessage(balanced.reductions, balanced.increases, targetDays);
  if (adj) parts.push(adj);
  else {
    parts.push(
      'Калорийность раскладки приведена к норме за ' + daysLabel + ' сут. ' +
      '(цель ≈ ' + Math.round(balanced.targetCal) + ' ккал, сейчас ≈ ' + Math.round(balanced.finalCal) + ' ккал).'
    );
  }
  if (!hadAdditions) {
    parts.push(
      'Продукты из рекомендаций не добавлялись. Если ниже остался дефицит — отметьте нужные позиции и снова нажмите «Создать новый список».'
    );
  }
  return parts.join(' ');
}

/** Polar → cartesian for SVG pie */
function polarXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function svgDonutSlice(cx, cy, rOuter, rInner, a0, a1, fill) {
  // full circle edge case
  const span = a1 - a0;
  if (span <= 0.01) return '';
  if (span >= 359.9) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + rOuter + '" fill="' + fill + '"/>' +
      (rInner > 0
        ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + rInner + '" fill="#faf7f1"/>'
        : '');
  }
  const large = span > 180 ? 1 : 0;
  const p0 = polarXY(cx, cy, rOuter, a0);
  const p1 = polarXY(cx, cy, rOuter, a1);
  const q1 = polarXY(cx, cy, rInner, a1);
  const q0 = polarXY(cx, cy, rInner, a0);
  if (rInner <= 0) {
    return '<path d="M ' + cx + ' ' + cy +
      ' L ' + p0.x.toFixed(2) + ' ' + p0.y.toFixed(2) +
      ' A ' + rOuter + ' ' + rOuter + ' 0 ' + large + ' 1 ' + p1.x.toFixed(2) + ' ' + p1.y.toFixed(2) +
      ' Z" fill="' + fill + '"/>';
  }
  return '<path d="M ' + p0.x.toFixed(2) + ' ' + p0.y.toFixed(2) +
    ' A ' + rOuter + ' ' + rOuter + ' 0 ' + large + ' 1 ' + p1.x.toFixed(2) + ' ' + p1.y.toFixed(2) +
    ' L ' + q1.x.toFixed(2) + ' ' + q1.y.toFixed(2) +
    ' A ' + rInner + ' ' + rInner + ' 0 ' + large + ' 0 ' + q0.x.toFixed(2) + ' ' + q0.y.toFixed(2) +
    ' Z" fill="' + fill + '"/>';
}

const COVERAGE_COLORS = [
  '#2f5d50', '#3d7a68', '#4a8f6e', '#5a9e5c', '#6aad4a',
  '#c4a035', '#d0892a', '#c96b3c', '#b85a5a', '#8b6b9e',
  '#5a7a9e', '#4a8a9e', '#3d8a7a', '#6b8f4a', '#9e7a4a',
];

/**
 * Equal sectors per nutrient; filled arc fraction = min(pct,100)/100; rest white.
 * Returns { chartHtml, totalPct } — days control is separate.
 */
function buildCoverageChartHtml(gaps) {
  const rows = (gaps || []).filter((g) => g && g.fillable !== false && g.daily > 0);
  if (!rows.length) {
    return {
      chartHtml:
        '<div class="coverage-chart"></div>' +
        '<div class="coverage-summary">' +
        '<p class="cov-label">Покрытие норм</p>' +
        '<p class="cov-pct">—</p>' +
        '<p class="cov-note">Нет данных по нутриентам</p></div>',
      totalPct: 0,
    };
  }
  const caps = rows.map((g) => Math.max(0, Math.min(100, Number(g.pct) || 0)));
  const totalPct = caps.reduce((s, v) => s + v, 0) / caps.length;
  const n = rows.length;
  const sector = 360 / n;
  const cx = 70;
  const cy = 70;
  const rOuter = 62;
  const rInner = 28;
  let svg = '<svg class="coverage-svg" width="140" height="140" viewBox="0 0 140 140" ' +
    'role="img" aria-label="Покрытие суточных норм по нутриентам">';
  svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + rOuter + '" fill="#ffffff" stroke="#e4ddd0" stroke-width="1"/>';
  svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + rInner + '" fill="#faf7f1"/>';
  for (let i = 0; i < n; i++) {
    const a0 = i * sector;
    const filledSpan = sector * (caps[i] / 100);
    const color = COVERAGE_COLORS[i % COVERAGE_COLORS.length];
    if (filledSpan > 0.15) {
      svg += svgDonutSlice(cx, cy, rOuter, rInner, a0, a0 + filledSpan, color);
    }
    const tip = polarXY(cx, cy, rOuter, a0);
    const inn = polarXY(cx, cy, rInner, a0);
    svg += '<line x1="' + inn.x.toFixed(2) + '" y1="' + inn.y.toFixed(2) +
      '" x2="' + tip.x.toFixed(2) + '" y2="' + tip.y.toFixed(2) +
      '" stroke="#e4ddd0" stroke-width="1"/>';
  }
  svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + rInner + '" fill="#faf7f1"/>';
  svg += '</svg>';

  const chartHtml =
    '<div class="coverage-chart">' + svg + '</div>' +
    '<div class="coverage-summary">' +
    '<p class="cov-label">Покрытие суточных норм (на срок)</p>' +
    '<p class="cov-pct">' + Math.round(totalPct) + '%</p>' +
    '<p class="cov-note">Среднее по ' + n + ' нутриентам: сектор = нутриент; ' +
    'заливка — доля закрытой нормы, белое — дефицит.</p>' +
    '</div>';
  return { chartHtml, totalPct };
}

function renderLayoutMode(panel, itemsRaw, daysFromQuery, fastFromQuery, trailFromQuery) {
  if (!matchIndex.length) buildMatchIndex();
  if (!String(itemsRaw || '').trim()) {
    panel.innerHTML =
      '<section class="mode-card"><h2>Анализ раскладки</h2>' +
      '<p class="err">Нет параметра <code>items</code> или <code>layout</code>.</p>' +
      '<p class="mode-note">Пример: <code>?mode=layout&amp;items=' +
      escapeHtml(exampleLayoutParam()) + '&amp;days=1</code></p></section>';
    return;
  }

  let targetDays = Number(daysFromQuery);
  if (!(targetDays > 0) || !Number.isFinite(targetDays)) targetDays = LAYOUT_DEFAULT_DAYS;
  let targetFast = normalizeFastDegree(fastFromQuery);
  let targetTrail = !!trailFromQuery;
  syncTrailCheckbox(targetTrail);

  const parsed = parseLayoutItems(itemsRaw);
  let matched = parsed.map((row) => {
    const m = findProductByName(row.original);
    return {
      original: row.original,
      grams: row.grams,
      auto: !!row.auto,
      product: m.product,
      score: m.score,
      autoSized: false,
    };
  });

  // Drop products not allowed for the selected fasting degree, then recalculate.
  if (targetFast) {
    const kept = [];
    const removedNames = [];
    for (const row of matched) {
      if (!row.product || productAllowedForFast(row.product, targetFast)) {
        kept.push(row);
      } else {
        removedNames.push(row.product.name);
      }
    }
    if (removedNames.length) {
      matched = kept;
      const itemsFiltered = buildLayoutItemsParamFromMatched(matched);
      itemsRaw = itemsFiltered;
      const shown = removedNames.slice(0, 8).join(', ') +
        (removedNames.length > 8 ? '…' : '');
      saveLayoutAdjustMessage(
        'По степени поста «' + fastDegreeLabel(targetFast) + '» убрано из раскладки: ' +
        removedNames.length + ' — ' + shown +
        '. Ниже — новый расчёт и рекомендации из допустимых продуктов.'
      );
      replaceLayoutUrl(itemsFiltered, targetDays, targetFast, targetTrail);
    }
  }

  // Drop products without istrail when «Походный запас» is on.
  if (targetTrail) {
    const kept = [];
    const removedNames = [];
    for (const row of matched) {
      if (!row.product || productAllowedForTrail(row.product, true)) {
        kept.push(row);
      } else {
        removedNames.push(row.product.name);
      }
    }
    if (removedNames.length) {
      matched = kept;
      const itemsFiltered = buildLayoutItemsParamFromMatched(matched);
      itemsRaw = itemsFiltered;
      const shown = removedNames.slice(0, 8).join(', ') +
        (removedNames.length > 8 ? '…' : '');
      saveLayoutAdjustMessage(
        'Фильтр «Походный запас»: убрано из раскладки ' +
        removedNames.length + ' — ' + shown +
        '. Рекомендации — только из продуктов длительного хранения.'
      );
      replaceLayoutUrl(itemsFiltered, targetDays, targetFast, targetTrail);
    }
  }

  matched = autoSizeLayoutPortions(matched, targetDays);

  const totals = accumulateLayout(matched);
  const inferred = analyzeDuration(totals);
  const duration = targetDays;
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
  const adjustMsg = takeLayoutAdjustMessage();
  if (adjustMsg) {
    html += '<div class="adjust-banner" role="status">' + escapeHtml(adjustMsg) + '</div>';
  }
  html += '<p class="mode-note">Целевой срок раскладки: <b>' + formatDays(targetDays) + ' сут.</b> ' +
    '(параметр <code>days</code> / поле справа от диаграммы). ';
  if (targetFast) {
    html += 'Степень поста: <b>' + escapeHtml(fastDegreeLabel(targetFast)) + '</b> ' +
      '(параметр <code>fastdegree</code>). ';
  } else {
    html += 'Степень поста не задана — <b>все продукты</b>. ';
  }
  if (inferred.durationNutrient) {
    html += 'По макросам текущий набор тянет примерно на ~' + inferred.duration.toFixed(2) +
      ' сут. («' + escapeHtml(inferred.durationNutrient.name) + '»). ';
  }
  html += 'Дефициты и рекомендации считаются на целевой срок.</p>';

  const coverage = buildCoverageChartHtml(gaps);
  let fastOpts = '';
  for (const opt of FAST_DEGREE_OPTIONS) {
    const sel = (opt.value === (targetFast || '')) ? ' selected' : '';
    fastOpts += '<option value="' + escapeHtml(opt.value) + '"' + sel + '>' +
      escapeHtml(opt.label) + '</option>';
  }
  html += '<div class="coverage-row">' + coverage.chartHtml +
    '<div class="coverage-controls">' +
    '<div class="coverage-days">' +
    '<label class="days-label" for="layoutDaysInput">Срок</label>' +
    '<div class="days-input-row">' +
    '<input type="number" id="layoutDaysInput" class="days-input" min="0.1" step="0.5" ' +
    'value="' + escapeHtml(String(targetDays)) + '" title="На сколько суток нужна раскладка" />' +
    '<span class="days-unit">сут.</span></div>' +
    '</div>' +
    '<div class="coverage-fast">' +
    '<label class="days-label" for="layoutFastInput">Степень поста</label>' +
    '<select id="layoutFastInput" class="fast-select" title="Ограничение по православному посту">' +
    fastOpts + '</select>' +
    '<p class="cov-note">По умолчанию — всё. При выборе убираются неподходящие продукты и строится новый список.</p>' +
    '</div>' +
    '<div class="coverage-trail">' +
    '<label class="trail-check" for="layoutTrailInput" title="Только продукты длительного хранения / компактный рацион">' +
    '<input type="checkbox" id="layoutTrailInput"' + (targetTrail ? ' checked' : '') + ' /> ' +
    'Походный запас</label>' +
    '<p class="cov-note">По умолчанию выкл. Вкл. — только shelf-stable (сушёное, крупы, орехи, специи…).</p>' +
    '</div></div></div>';

  html += '<h3>Ваша раскладка</h3><table class="mode-table layout-table"><thead><tr>' +
    '<th class="col-del"></th><th>В ссылке</th><th>Найдено в базе</th><th>Кол-во</th><th>совпад.</th></tr></thead><tbody>';
  for (let i = 0; i < matched.length; i++) {
    const it = matched[i];
    const unit = it.product && it.product.section === 'bad' ? ' шт.' : ' г';
    const qtyNote = it.autoSized ? ' <span class="pill warn" title="Подобрано под срок">авто</span>' : '';
    html += '<tr data-layout-idx="' + i + '">' +
      '<td class="col-del"><button type="button" class="btn-trash btn-layout-trash" ' +
      'title="Удалить из раскладки и пересчитать" aria-label="Удалить">' + trashIconSvg() + '</button></td>' +
      '<td><code>' + escapeHtml(it.original) + '</code></td><td>' +
      (it.product
        ? escapeHtml(it.product.name) + (it.product.section === 'bad' ? ' <span class="badge-bad">БАД</span>' : '')
        : '<span class="miss">не найдено</span>') +
      '</td><td class="num">' + (it.grams > 0 ? (it.grams + unit) : '—') + qtyNote +
      '</td><td class="num">' + (it.product ? Math.round(it.score) : '—') + '</td></tr>';
  }
  html += '</tbody></table>';

  html += '<div id="recSection"></div>';

  html += '<h3>Нутриенты на срок ' + formatDays(duration) + ' сут.</h3>';
  html += '<table class="mode-table nutr-table"><thead><tr><th>Нутриент</th><th>Есть</th><th>Нужно</th><th>Норма/сут</th><th>Дефицит</th><th>%</th></tr></thead><tbody>';
  for (const g of gaps) {
    const isCal = /^Калорийность$/i.test(String(g.n.name));
    const ok = g.pct >= LAYOUT_COMPLETE_RATIO * 100;
    const cls = (ok ? 'nutr-ok' : 'nutr-low') + (isCal ? ' nutr-cal' : '') +
      (ok ? ' ok' : (g.pct >= 50 ? ' warn' : ' bad'));
    html += '<tr class="' + cls + '"><td>' + escapeHtml(g.n.name) +
      (isCal ? ' <span class="pill ok">главное</span>' : '') + '</td>' +
      '<td class="num">' + escapeHtml(formatValue(g.have, g.n.units)) + '</td>' +
      '<td class="num">' + escapeHtml(formatValue(g.need, g.n.units)) + '</td>' +
      '<td class="num">' + escapeHtml(formatValue(g.daily, g.n.units)) + '</td>' +
      '<td class="num">' + escapeHtml(formatValue(g.shortage, g.n.units)) + '</td>' +
      '<td class="num">' + g.pct.toFixed(0) + '%</td></tr>';
  }
  html += '</tbody></table>';

  html += '<div id="examplesSection"></div>';

  html += '<p class="mode-note" id="layoutShareNote"><b>Ссылка (для копирования / когда снова будет сеть):</b><br/>' +
    '<code id="layoutShareUrl">' + escapeHtml(layoutUrl(itemsRaw, targetDays, targetFast, targetTrail)) + '</code></p>';

  html += '<p class="mode-note"><b>Формат:</b> <code>items</code> — <code>slug</code> или <code>slug:grams</code> · ' +
    '<code>id:N</code> / <code>id:N:g</code>; <code>days</code> (или <code>time</code>) — срок в сутках; ' +
    '<code>fastdegree</code> — степень поста (<code>сухоядение</code> / <code>до масла</code> / <code>до рыбы</code> / <code>скоромное</code>), по умолчанию не задана; ' +
    '<code>trail=1</code> — только походный запас (<code>istrail</code>). ' +
    'Без количества при указанном сроке граммы/шт. подбираются автоматически. ' +
    'Все расчёты и «Создать новый список» работают <b>локально в этом файле</b> (без запроса к серверу).</p>';

  box.innerHTML = html;
  panel.appendChild(box);

  function refreshLayout(nextItems, nextDays, nextFast, nextTrail) {
    const t = nextTrail == null ? targetTrail : !!nextTrail;
    replaceLayoutUrl(nextItems, nextDays, nextFast, t);
    renderLayoutMode(panel, nextItems, nextDays, nextFast, t);
  }

  box.querySelectorAll('.btn-layout-trash').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tr = btn.closest('tr');
      const idx = Number(tr && tr.getAttribute('data-layout-idx'));
      if (!Number.isFinite(idx)) return;
      const next = matched.filter((_, i) => i !== idx);
      const items = buildLayoutItemsParamFromMatched(next);
      refreshLayout(items, targetDays, targetFast, targetTrail);
    });
  });

  const daysInput = box.querySelector('#layoutDaysInput');
  if (daysInput) {
    const applyDays = () => {
      let v = Number(String(daysInput.value).replace(',', '.'));
      if (!(v > 0) || !Number.isFinite(v)) v = LAYOUT_DEFAULT_DAYS;
      daysInput.value = String(v);
      refreshLayout(itemsRaw, v, targetFast, targetTrail);
    };
    daysInput.addEventListener('change', applyDays);
    daysInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyDays();
      }
    });
  }

  const fastInput = box.querySelector('#layoutFastInput');
  if (fastInput) {
    fastInput.addEventListener('change', () => {
      const nextFast = normalizeFastDegree(fastInput.value);
      refreshLayout(itemsRaw, targetDays, nextFast, targetTrail);
    });
  }

  const trailInput = box.querySelector('#layoutTrailInput');
  if (trailInput) {
    trailInput.addEventListener('change', () => {
      syncTrailCheckbox(trailInput.checked);
      refreshLayout(itemsRaw, targetDays, targetFast, trailInput.checked);
    });
  }

  const recMount = box.querySelector('#recSection');
  const examplesMount = box.querySelector('#examplesSection');

  function renderExamples(exIds) {
    const examples = exampleSpecs.map((spec) => {
      const r = recommendAdditions(totals, duration, spec.shift, {
        preferBad: spec.preferBad,
        excludeIds: exIds,
        fastdegree: targetFast,
        trailOnly: targetTrail,
      });
      return {
        label: spec.label,
        items: matched.filter((x) => x.product && x.grams > 0).map((x) => ({ product: x.product, grams: x.grams }))
          .concat(r.added.map((a) => ({ product: a.product, grams: a.grams }))),
        complete: isLayoutComplete(r.totals, duration),
      };
    });
    let ehtml = '<h3>Примеры более полных раскладок</h3>';
    ehtml += '<p class="mode-note">Примеры <b>1</b> и <b>2</b> — только продукты; ' +
      'пример <b>3</b> — с несколькими БАДами. На срок ' + formatDays(duration) + ' сут.' +
      (targetFast ? (' С учётом поста «' + escapeHtml(fastDegreeLabel(targetFast)) + '».') : '') +
      (targetTrail ? ' Только походный запас.' : '') +
      '</p>';
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
    const overrides = loadRecOverrides();
    const rec = recommendAdditions(totals, duration, 0, {
      preferBad: false,
      excludeIds: exIds,
      fastdegree: targetFast,
      trailOnly: targetTrail,
    });
    // Apply analogue replacements chosen earlier (origId → replacementId).
    const displayRows = rec.added.map((a) => {
      const origId = a.originalId || a.product.id;
      const replId = Number(overrides[String(origId)]);
      let product = a.product;
      let grams = a.grams;
      if (replId && replId !== origId) {
        const repl = productsCache.find((p) => p.id === replId);
        if (repl) {
          product = repl;
          grams = gramsMatchingNutrient(
            a.product, a.grams, repl,
            a.forNutrientId != null ? a.forNutrientId : nutrientIdByName(a.forNutrient)
          );
        }
      }
      return {
        product,
        grams,
        forNutrient: a.forNutrient,
        forNutrientId: a.forNutrientId != null ? a.forNutrientId : nutrientIdByName(a.forNutrient),
        originalId: origId,
        originalProduct: a.product,
        originalGrams: a.grams,
      };
    });

    let rhtml = '<div class="rec-head">' +
      '<h3 class="rec-title">Рекомендуется добавить</h3>' +
      '<button type="button" class="btn-new-list" id="btnNewList" ' +
      'title="Пересчитать в этом файле (без сети) и обновить ссылку в адресной строке">' +
      'Создать новый список</button></div>';
      rhtml += '<p class="mode-note">«Создать новый список» всегда приводит <b>калорийность за срок к норме</b> ' +
      '(даже без галочек). Отметьте продукты и при необходимости измените <b>количество</b>, чтобы добавить их в список. ' +
      'Кнопка <b>Аналоги</b> — выбрать близкий по составу продукт вместо предложенного. ' +
      'Пересчёт <b>внутри страницы</b> (офлайн). Если после балансировки останется дефицит — снова появятся рекомендации. ' +
      'Корзина в рекомендациях — убрать предложение; корзина в «Ваша раскладка» — удалить продукт и пересчитать.</p>';

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

    if (!displayRows.length) {
      rhtml += '<p class="mode-note">Раскладка уже достаточно полная на этот срок (или нечего подобрать после исключений).</p>';
    } else {
      rhtml += '<table class="mode-table rec-table"><thead><tr>' +
        '<th class="col-check"><input type="checkbox" class="rec-check-all" id="recCheckAll" ' +
        'title="Выбрать всё / снять всё" aria-label="Выбрать всё" /></th>' +
        '<th class="col-product" id="recProductHead" title="Выбрать всё / снять всё">Продукт</th>' +
        '<th>Кол-во</th><th>Закрывает</th><th class="col-analog"></th><th class="col-del"></th>' +
        '</tr></thead><tbody>';
      for (const a of displayRows) {
        const unit = a.product.section === 'bad' ? ' шт.' : ' г';
        const step = a.product.section === 'bad' ? '1' : '10';
        const swapped = a.product.id !== a.originalId;
        rhtml += '<tr data-pid="' + a.product.id + '" data-grams="' + a.grams + '" ' +
          'data-orig-pid="' + a.originalId + '" data-nutrient-id="' +
          (a.forNutrientId != null ? a.forNutrientId : '') + '" ' +
          'data-nutrient-name="' + escapeHtml(a.forNutrient || '') + '" ' +
          'data-orig-grams="' + a.originalGrams + '">' +
          '<td class="col-check"><input type="checkbox" class="rec-check" aria-label="Выбрать" /></td>' +
          '<td><span class="rec-pname">' + escapeHtml(a.product.name) + '</span>' +
          (a.product.section === 'bad' ? ' <span class="badge-bad">БАД</span>' : '') +
          (swapped ? ' <span class="pill warn" title="Заменён аналогом">аналог</span>' : '') +
          '</td>' +
          '<td class="num col-qty"><input type="number" class="rec-qty" min="1" step="' + step + '" ' +
          'value="' + a.grams + '" title="Количество для нового списка" aria-label="Количество" />' +
          '<span class="qty-unit">' + unit + '</span></td>' +
          '<td>' + escapeHtml(a.forNutrient) + '</td>' +
          '<td class="col-analog"><button type="button" class="btn-analog" title="Показать аналоги по составу">Аналоги</button></td>' +
          '<td class="col-del"><button type="button" class="btn-trash" title="Удалить и подобрать другое" ' +
          'aria-label="Удалить">' + trashIconSvg() + '</button></td></tr>';
      }
      rhtml += '</tbody></table>';
    }
    recMount.innerHTML = rhtml;

    function allRecChecks() {
      return [...recMount.querySelectorAll('.rec-check')];
    }

    function syncCheckAllState() {
      const boxes = allRecChecks();
      const master = recMount.querySelector('#recCheckAll');
      if (!master || !boxes.length) return;
      const nOn = boxes.filter((b) => b.checked).length;
      master.checked = nOn === boxes.length && boxes.length > 0;
      master.indeterminate = nOn > 0 && nOn < boxes.length;
    }

    function toggleSelectAll() {
      const boxes = allRecChecks();
      if (!boxes.length) return;
      const allOn = boxes.every((b) => b.checked);
      const next = !allOn;
      boxes.forEach((b) => { b.checked = next; });
      syncCheckAllState();
    }

    const master = recMount.querySelector('#recCheckAll');
    if (master) master.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSelectAll();
    });
    const prodHead = recMount.querySelector('#recProductHead');
    if (prodHead) prodHead.addEventListener('click', toggleSelectAll);
    allRecChecks().forEach((b) => b.addEventListener('change', syncCheckAllState));
    syncCheckAllState();

    recMount.querySelectorAll('.rec-qty').forEach((inp) => {
      const sync = () => {
        const tr = inp.closest('tr');
        let v = Number(String(inp.value).replace(',', '.'));
        if (!(v > 0) || !Number.isFinite(v)) v = 1;
        inp.value = String(v);
        if (tr) tr.setAttribute('data-grams', String(v));
      };
      inp.addEventListener('change', sync);
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sync();
        }
      });
    });

    recMount.querySelectorAll('.btn-analog').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tr = btn.closest('tr');
        if (!tr) return;
        const origId = Number(tr.getAttribute('data-orig-pid'));
        const selectedId = Number(tr.getAttribute('data-pid'));
        const nutrientIdRaw = tr.getAttribute('data-nutrient-id');
        const nutrientId = nutrientIdRaw ? Number(nutrientIdRaw) : null;
        const nutrientName = tr.getAttribute('data-nutrient-name') || '';
        const origGrams = Number(tr.getAttribute('data-orig-grams')) ||
          Number(tr.getAttribute('data-grams'));
        const origProduct = productsCache.find((p) => p.id === origId);
        if (!origProduct) return;
        const layoutIds = matched
          .filter((x) => x.product && x.grams > 0)
          .map((x) => x.product.id);
        openAnalogModal({
          product: origProduct,
          selectedId,
          grams: origGrams,
          nutrientName,
          nutrientId,
          fastdegree: targetFast,
          trailOnly: targetTrail,
          excludeIds: layoutIds,
          onOk: (replacementId) => {
            const ov = loadRecOverrides();
            if (replacementId === origId) delete ov[String(origId)];
            else ov[String(origId)] = replacementId;
            saveRecOverrides(ov);
            renderRecommendations();
          },
        });
      });
    });

    recMount.querySelectorAll('.btn-trash').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tr = btn.closest('tr');
        const pid = Number(tr && tr.getAttribute('data-pid'));
        if (!pid) return;
        const origId = Number(tr.getAttribute('data-orig-pid'));
        const next = loadLayoutExcludeIds();
        next.add(pid);
        saveLayoutExcludeIds(next);
        if (origId) {
          const ov = loadRecOverrides();
          if (ov[String(origId)]) {
            delete ov[String(origId)];
            saveRecOverrides(ov);
          }
        }
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
          .filter((x) => x.product && x.grams > 0)
          .map((x) => ({ product: x.product, grams: x.grams }));
        if (!baseParts.length) {
          alert('В раскладке нет продуктов с количеством — нечего приводить к норме калорий.');
          return;
        }
        const checked = [];
        recMount.querySelectorAll('tr[data-pid]').forEach((tr) => {
          const cb = tr.querySelector('.rec-check');
          if (cb && cb.checked) {
            const qtyEl = tr.querySelector('.rec-qty');
            let grams = qtyEl
              ? Number(String(qtyEl.value).replace(',', '.'))
              : Number(tr.getAttribute('data-grams'));
            if (!(grams > 0) || !Number.isFinite(grams)) {
              grams = Number(tr.getAttribute('data-grams')) || 0;
            }
            checked.push({
              product: productsCache.find((p) => p.id === Number(tr.getAttribute('data-pid'))),
              grams,
            });
          }
        });
        if (checked.some((c) => !c.product || !(c.grams > 0))) {
          alert('У отмеченных продуктов укажите количество больше нуля.');
          return;
        }
        const merged = baseParts.concat(checked);
        const balanced = balancePartsToCalorieNorm(merged, targetDays);
        const msg = formatCalorieOnlyMessage(balanced, targetDays, checked.length > 0);
        if (msg) saveLayoutAdjustMessage(msg);
        const items = buildLayoutItemsParam(balanced.parts);
        refreshLayout(items, targetDays, targetFast, targetTrail);
      });
    }

    renderExamples(exIds);
  }

  renderRecommendations();
}

function formatDays(d) {
  const n = Number(d);
  if (!Number.isFinite(n)) return String(d);
  return (Math.round(n * 100) / 100).toString();
}

function findBadProductByTitle(substr) {
  const s = String(substr || '').toLowerCase();
  return productsCache.find((p) => p.section === 'bad' && p.nameLower.includes(s)) || null;
}

function exampleLayoutParam() {
  // Demo URL (foods only) — базовые продукты + сушёные овощи; без БАД.
  return (
    'yajco_kurinoe_celoe:100,grechiha_zerno:150,moloko_suhoe_1:40,krupa_risovaya:100,' +
    'morkov_sushenaya:30,perec_sladkij_sushenyj:20,luk_repchatyj_sushenyj:20,' +
    'svekla_sushenaya:20,kapusta_belokochannaya_sushenaya:25,tomaty_vyalenye:30,' +
    'tykva_sushenaya:25,shpinat_sushenyj:15,brokkoli_sushenaya:15'
  );
}

function renderDefaultModeLinks(panel) {
  const base = pageBaseUrl();
  const urlNutrients = base + '?mode=nutrients';
  const urlLayout = layoutUrl(exampleLayoutParam(), LAYOUT_DEFAULT_DAYS);
  const urlLayoutAuto = layoutUrl(
    'yajco_kurinoe_celoe,grechiha_zerno,moloko_suhoe_1,krupa_risovaya,' +
    'morkov_sushenaya,perec_sladkij_sushenyj,luk_repchatyj_sushenyj,' +
    'svekla_sushenaya,kapusta_belokochannaya_sushenaya,tomaty_vyalenye',
    3
  );
  panel.innerHTML =
    '<section class="mode-card mode-links">' +
    '<h2>Режимы по ссылке (GET)</h2>' +
    '<p class="mode-note"><b>Офлайн:</b> один файл <code>dietolog.html</code> уже содержит всю базу (~' +
    escapeHtml(formatSeedSizeHint()) +
    '). Кнопка «Скачать HTML с базой» сверху — для телефона/планшета Android без GitHub Pages.</p>' +
    '<ol class="mode-ol">' +
    '<li><b>Нутриенты → главные продукты:</b><br/>' +
    '<a href="' + escapeHtml(urlNutrients) + '">' + escapeHtml(urlNutrients) + '</a></li>' +
    '<li><b>Анализ раскладки (пример):</b><br/>' +
    '<a href="' + escapeHtml(urlLayout) + '">' + escapeHtml(urlLayout) + '</a><br/>' +
    '<span class="mode-note">Параметры: <code>items</code> (продукты), <code>days</code> (срок, по умолчанию 1), ' +
    '<code>fastdegree</code> (степень поста, по умолчанию не задана = всё), ' +
    '<code>trail=1</code> (походный запас). ' +
    'Без граммов при <code>days</code> количества подбираются. Примеры 1–2 без БАД; пример <b>3 — с БАДами</b>.</span><br/>' +
    '<span class="mode-note">Без количеств на 3 суток: <a href="' + escapeHtml(urlLayoutAuto) + '">' +
    escapeHtml(urlLayoutAuto) + '</a></span><br/>' +
    '<span class="mode-note">Пост сухоядение: <a href="' +
    escapeHtml(layoutUrl(exampleLayoutParam(), 1, 'сухоядение')) + '">' +
    escapeHtml(layoutUrl(exampleLayoutParam(), 1, 'сухоядение')) + '</a></span><br/>' +
    '<span class="mode-note">Походный запас: <a href="' +
    escapeHtml(layoutUrl(exampleLayoutParam(), 1, null, true)) + '">' +
    escapeHtml(layoutUrl(exampleLayoutParam(), 1, null, true)) + '</a></span></li>' +
    '</ol>' +
    '<p class="mode-note">Ниже — обычный просмотр: поиск → группа → продукт → нутриенты. Чекбокс «Походный запас» фильтрует справочник.</p>' +
    '</section>';
}

function applyModeUi(query) {
  const panel = document.getElementById('modePanel');
  const lead = document.getElementById('leadText');
  const toolbar = document.getElementById('toolbar');
  if (!panel) return;

  syncTrailCheckbox(!!query.trail);

  if (query.mode === 'nutrients') {
    if (lead) lead.innerHTML = 'Режим: <b>нутриенты</b> → топ продуктов по содержанию и % суточной нормы. Ниже — полный список продуктов.';
    renderNutrientsMode(panel);
    if (toolbar) toolbar.style.display = '';
  } else if (query.mode === 'layout') {
    if (lead) lead.innerHTML = 'Режим: <b>анализ раскладки</b>. Сначала результат и примеры, ниже — поиск и справочник продуктов.';
    renderLayoutMode(panel, query.itemsRaw, query.days, query.fastdegree, query.trail);
    if (toolbar) toolbar.style.display = '';
  } else {
    if (lead) lead.innerHTML = 'Поиск → <b>группа</b> → продукт → нутриенты. Все БАДы в одной группе <b>БАД</b>.';
    renderDefaultModeLinks(panel);
    if (toolbar) toolbar.style.display = '';
  }
}
