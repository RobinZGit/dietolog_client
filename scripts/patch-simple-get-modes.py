# -*- coding: utf-8 -*-
"""Inject GET modes (v11) into simple/dietolog.html without touching SEED."""
from __future__ import annotations

import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
HTML = ROOT / "simple" / "dietolog.html"
MODES_JS = ROOT / "scripts" / "simple-get-modes.js"

CSS_EXTRA = """
    #modePanel { margin-bottom: 1rem; max-width: 920px; margin-left: auto; margin-right: auto; padding: 0 1.25rem; }
    .mode-card {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--panel);
      padding: 0.9rem 1rem 1.1rem;
      margin-bottom: 0.75rem;
    }
    .mode-card h2 { margin: 0 0 0.4rem; font-size: 1.05rem; color: var(--accent); }
    .mode-card h3 { margin: 1rem 0 0.35rem; font-size: 0.95rem; }
    .mode-card h4 { margin: 0.5rem 0 0.25rem; font-size: 0.9rem; }
    .mode-note { color: var(--muted); font-size: 0.86rem; margin: 0.25rem 0 0.6rem; }
    .mode-note code, .mode-card code {
      font-size: 0.82em; background: #f0ebe1; padding: 0.05rem 0.3rem; border-radius: 4px;
      word-break: break-all;
    }
    .mode-ol { margin: 0.4rem 0 0.6rem 1.1rem; padding: 0; line-height: 1.45; }
    .mode-ol li { margin-bottom: 0.65rem; }
    .mode-ol a { color: var(--accent); word-break: break-all; }
    .mode-list { margin-top: 0.5rem; }
    .mode-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; margin: 0.35rem 0 0.5rem; }
    .mode-table th, .mode-table td {
      padding: 0.28rem 0.35rem;
      border-bottom: 1px solid color-mix(in srgb, var(--line) 70%, transparent);
      text-align: left; vertical-align: top;
    }
    .mode-table th { color: var(--muted); font-weight: 600; font-size: 0.76rem; }
    .mode-table td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .mode-table tr.ok td:last-child { color: #1f6b4a; font-weight: 700; }
    .mode-table tr.warn td:last-child { color: #8a6a12; font-weight: 700; }
    .mode-table tr.bad td:last-child { color: #8b1e1e; font-weight: 700; }
    .miss { color: #8b1e1e; font-weight: 600; }
    .pill {
      display: inline-block; font-size: 0.72rem; font-weight: 700;
      padding: 0.1rem 0.4rem; border-radius: 999px; vertical-align: middle;
    }
    .pill.ok { background: #d8f0e4; color: #1f6b4a; }
    .pill.warn { background: #f5ecd2; color: #8a6a12; }
    .example-block {
      border: 1px dashed var(--line); border-radius: 8px;
      padding: 0.5rem 0.75rem; margin: 0.4rem 0;
      background: #faf7f1;
    }
    .example-list { margin: 0.2rem 0 0.2rem 1.1rem; padding: 0; }
    .browse-title {
      max-width: 920px; margin: 0 auto 0.35rem; padding: 0 1.25rem;
      font-size: 0.85rem; color: var(--muted); font-weight: 600;
    }
"""

BODY_HEADER = '  <header>
    <h1>Диетолог <span style="font-weight:500;color:var(--muted);font-size:0.75em">простой</span> <span id="appVersion" class="ver">v10</span></h1>
    <p class="lead" id="leadText">Поиск → <b>группа</b> → продукт → нутриенты. Все БАДы в одной группе <b>БАД</b>.</p>
    <div class="toolbar" id="toolbar">
      <input id="q" type="search" placeholder="Поиск продукта или группы…" autocomplete="off" />
      <div id="status">Загрузка…</div>
    </div>
  </header>
  <div id="modePanel"></div>
  <p class="browse-title" id="browseTitle">Справочник продуктов</p>
  <main>
    <div id="list" class="list"><div class="loading">Загрузка групп…</div></div>
  </main>
'

MAIN_REPLACEMENT = """
function setVersionLabel() {
  const v = 'v' + SEED.version;
  const el = document.getElementById('appVersion');
  if (el) el.textContent = v;
  const q = parseQuery();
  const modeTag = q.mode === 'browse' ? '' : (' В· ' + q.mode);
  document.title = 'Диетолог — простой ' + v + modeTag;
}

function wireUi() {
  const q = document.getElementById('q');
  if (!q) return;
  let t = null;
  q.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => renderList(q.value), 80);
  });
}

async function main() {
  const status = document.getElementById('status');
  const list = document.getElementById('list');
  const query = parseQuery();
  try {
    setVersionLabel();
    loadCachesFromSeed();
    buildMatchIndex();
    applyModeUi(query);
    renderList('');
    wireUi();
    const qEl = document.getElementById('q');
    if (qEl && query.mode === 'browse') qEl.focus();
    Promise.resolve().then(async () => {
      try {
        db = await openDb();
        const seeded = await seedIfNeeded();
        const st = document.getElementById('status');
        if (st) st.title = seeded
          ? 'IndexedDB РѕР±РЅРѕРІР»РµРЅР° (v' + SEED.version + ')'
          : 'IndexedDB Р°РєС‚СѓР°Р»СЊРЅР° (v' + SEED.version + ')';
      } catch (e) {
        console.warn('IndexedDB optional failed', e);
      }
    });
  } catch (e) {
    console.error(e);
    if (list) list.innerHTML = '<div class="err">РћС€РёР±РєР°: ' + escapeHtml(e && e.message ? e.message : e) + '</div>';
    if (status) status.textContent = 'РћС€РёР±РєР°';
  }
}

main();
"""


def main() -> None:
    html = HTML.read_text(encoding="utf-8")
    modes = MODES_JS.read_text(encoding="utf-8")

    if "/* === GET modes (v11)" in html and "function parseQuery()" in html:
        # re-inject: strip old modes block
        html = re.sub(
            r"/\* === GET modes \(v11\).*?(?=function setVersionLabel\()",
            "",
            html,
            count=1,
            flags=re.S,
        )

    if ".mode-card {" not in html:
        html = html.replace("    .err { color: #8b1e1e; padding: 1rem; }\n  </style>",
                            "    .err { color: #8b1e1e; padding: 1rem; }\n" + CSS_EXTRA + "  </style>")

    # Replace header+main block
    html = re.sub(
        r"  <header>[\s\S]*?</main>\n",
        BODY_HEADER + "\n",
        html,
        count=1,
    )

    # Replace from setVersionLabel through main(); with modes + new main
    m = re.search(r"function setVersionLabel\(\)[\s\S]*?\nmain\(\);\n", html)
    if not m:
        raise SystemExit("setVersionLabel/main block not found")
    html = html[: m.start()] + modes + "\n" + MAIN_REPLACEMENT + "\n" + html[m.end() :]

    # Ensure modePanel sits correctly вЂ” already in BODY_HEADER
    HTML.write_text(html, encoding="utf-8")
    print("patched", HTML, "bytes", HTML.stat().st_size)


if __name__ == "__main__":
    main()

