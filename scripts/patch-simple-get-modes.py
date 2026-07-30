# -*- coding: utf-8 -*-
"""Inject GET modes into simple/dietolog.html without touching SEED."""
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
    .rec-head {
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.65rem 1rem;
      margin: 1rem 0 0.35rem; justify-content: space-between;
    }
    .rec-head .rec-title { margin: 0; font-size: 0.95rem; }
    .btn-new-list {
      border: none; cursor: pointer; font-weight: 700; font-size: 0.88rem;
      padding: 0.45rem 0.9rem; border-radius: 8px;
      background: #e8a317; color: #1c1408;
      box-shadow: 0 1px 0 rgba(0,0,0,0.08);
    }
    .btn-new-list:hover { filter: brightness(1.06); }
    .btn-trash {
      border: 1px solid var(--line); background: #fff; color: #8b1e1e;
      border-radius: 6px; padding: 0.2rem 0.35rem; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .btn-trash:hover { background: #fde8e8; }
    .rec-table .col-check, .rec-table .col-del { width: 2.2rem; text-align: center; }
    .rec-check { width: 1.05rem; height: 1.05rem; cursor: pointer; accent-color: var(--accent); }
    .exclude-bar {
      display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center;
      margin: 0.35rem 0 0.55rem; font-size: 0.82rem;
    }
    .exclude-label { color: var(--muted); margin-right: 0.15rem; }
    .exclude-chip {
      border: 1px solid #d4b4b4; background: #f8ecec; color: #6b3030;
      border-radius: 999px; padding: 0.12rem 0.55rem; cursor: pointer; font-size: 0.78rem;
    }
    .exclude-chip:hover { background: #f0dada; }
    .exclude-clear {
      border: none; background: transparent; color: var(--accent);
      cursor: pointer; font-size: 0.78rem; text-decoration: underline; padding: 0.1rem 0.25rem;
    }
    .coverage-row {
      display: flex; flex-wrap: wrap; align-items: center; gap: 1.25rem 1.75rem;
      margin: 0.75rem 0 1rem; padding: 0.75rem 0.9rem;
      border: 1px solid var(--line); border-radius: 10px; background: #faf7f1;
    }
    .coverage-chart { flex: 0 0 auto; }
    .coverage-chart svg { display: block; }
    .coverage-summary { flex: 1 1 12rem; min-width: 10rem; }
    .coverage-summary .cov-label {
      margin: 0 0 0.2rem; color: var(--muted); font-size: 0.82rem; font-weight: 600;
    }
    .coverage-summary .cov-pct {
      margin: 0; font-size: 2.1rem; font-weight: 800; color: var(--accent);
      font-variant-numeric: tabular-nums; line-height: 1.1;
    }
    .coverage-summary .cov-note { margin: 0.35rem 0 0; color: var(--muted); font-size: 0.8rem; }
    .coverage-days {
      flex: 0 1 11rem; min-width: 9rem;
      padding: 0.35rem 0.5rem 0.35rem 0.75rem;
      border-left: 1px dashed var(--line);
    }
    .days-label {
      display: block; font-size: 0.82rem; font-weight: 700; color: var(--muted); margin-bottom: 0.25rem;
    }
    .days-input-row { display: flex; align-items: center; gap: 0.35rem; }
    .days-input {
      width: 4.5rem; font-size: 1.15rem; font-weight: 700; padding: 0.3rem 0.4rem;
      border: 1px solid var(--line); border-radius: 6px; color: var(--accent);
      font-variant-numeric: tabular-nums;
    }
    .days-unit { font-size: 0.9rem; color: var(--muted); font-weight: 600; }
    .rec-table th.col-product {
      cursor: pointer; user-select: none;
    }
    .rec-table th.col-product:hover { color: var(--accent); }
"""

# ASCII-safe BODY (unicode escapes)
BODY_HEADER = (
    "  <header>\n"
    "    <h1>\u0414\u0438\u0435\u0442\u043e\u043b\u043e\u0433 "
    '<span style="font-weight:500;color:var(--muted);font-size:0.75em">'
    "\u043f\u0440\u043e\u0441\u0442\u043e\u0439</span> "
    '<span id="appVersion" class="ver">v16</span></h1>\n'
    '    <p class="lead" id="leadText">'
    "\u041f\u043e\u0438\u0441\u043a \u2192 <b>\u0433\u0440\u0443\u043f\u043f\u0430</b> \u2192 "
    "\u043f\u0440\u043e\u0434\u0443\u043a\u0442 \u2192 \u043d\u0443\u0442\u0440\u0438\u0435\u043d\u0442\u044b. "
    "\u0412\u0441\u0435 \u0411\u0410\u0414\u044b \u0432 \u043e\u0434\u043d\u043e\u0439 \u0433\u0440\u0443\u043f\u043f\u0435 "
    "<b>\u0411\u0410\u0414</b>.</p>\n"
    '    <div class="toolbar" id="toolbar">\n'
    '      <input id="q" type="search" placeholder="'
    "\u041f\u043e\u0438\u0441\u043a \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u0430 \u0438\u043b\u0438 \u0433\u0440\u0443\u043f\u043f\u044b\u2026"
    '" autocomplete="off" />\n'
    '      <div id="status">\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430\u2026</div>\n'
    "    </div>\n"
    "  </header>\n"
    '  <div id="modePanel"></div>\n'
    '  <p class="browse-title" id="browseTitle">'
    "\u0421\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u043e\u0432</p>\n"
    "  <main>\n"
    '    <div id="list" class="list"><div class="loading">'
    "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0433\u0440\u0443\u043f\u043f\u2026"
    "</div></div>\n"
    "  </main>\n"
)

MAIN_REPLACEMENT = (
    "\nfunction setVersionLabel() {\n"
    "  const v = 'v' + SEED.version;\n"
    "  const el = document.getElementById('appVersion');\n"
    "  if (el) el.textContent = v;\n"
    "  const q = parseQuery();\n"
    "  const modeTag = q.mode === 'browse' ? '' : (' \\u00b7 ' + q.mode);\n"
    "  document.title = '\\u0414\\u0438\\u0435\\u0442\\u043e\\u043b\\u043e\\u0433 \\u2014 "
    "\\u043f\\u0440\\u043e\\u0441\\u0442\\u043e\\u0439 ' + v + modeTag;\n"
    "}\n"
    "\nfunction wireUi() {\n"
    "  const q = document.getElementById('q');\n"
    "  if (!q) return;\n"
    "  let t = null;\n"
    "  q.addEventListener('input', () => {\n"
    "    clearTimeout(t);\n"
    "    t = setTimeout(() => renderList(q.value), 80);\n"
    "  });\n"
    "}\n"
    "\nasync function main() {\n"
    "  const status = document.getElementById('status');\n"
    "  const list = document.getElementById('list');\n"
    "  const query = parseQuery();\n"
    "  try {\n"
    "    setVersionLabel();\n"
    "    loadCachesFromSeed();\n"
    "    buildMatchIndex();\n"
    "    applyModeUi(query);\n"
    "    renderList('');\n"
    "    wireUi();\n"
    "    const qEl = document.getElementById('q');\n"
    "    if (qEl && query.mode === 'browse') qEl.focus();\n"
    "    Promise.resolve().then(async () => {\n"
    "      try {\n"
    "        db = await openDb();\n"
    "        const seeded = await seedIfNeeded();\n"
    "        const st = document.getElementById('status');\n"
    "        if (st) st.title = seeded\n"
    "          ? 'IndexedDB \\u043e\\u0431\\u043d\\u043e\\u0432\\u043b\\u0435\\u043d\\u0430 (v' + SEED.version + ')'\n"
    "          : 'IndexedDB \\u0430\\u043a\\u0442\\u0443\\u0430\\u043b\\u044c\\u043d\\u0430 (v' + SEED.version + ')';\n"
    "      } catch (e) {\n"
    "        console.warn('IndexedDB optional failed', e);\n"
    "      }\n"
    "    });\n"
    "  } catch (e) {\n"
    "    console.error(e);\n"
    "    if (list) list.innerHTML = '<div class=\"err\">\\u041e\\u0448\\u0438\\u0431\\u043a\\u0430: ' + "
    "escapeHtml(e && e.message ? e.message : e) + '</div>';\n"
    "    if (status) status.textContent = '\\u041e\\u0448\\u0438\\u0431\\u043a\\u0430';\n"
    "  }\n"
    "}\n"
    "\nmain();\n"
)


def main() -> None:
    # Expand \\u escapes in MAIN_REPLACEMENT for real UTF-8 in HTML
    main_js = MAIN_REPLACEMENT.encode("utf-8").decode("unicode_escape")
    html = HTML.read_text(encoding="utf-8")
    modes = MODES_JS.read_text(encoding="utf-8")
    if "function setVersionLabel" in modes:
        modes = modes[: modes.find("function setVersionLabel")]

    if "/* === GET modes (v11)" in html and "function parseQuery()" in html:
        html = re.sub(
            r"/\* === GET modes \(v11\).*?(?=function setVersionLabel\(|$</script>)",
            "",
            html,
            count=1,
            flags=re.S,
        )

    # Refresh mode CSS block (idempotent)
    html = re.sub(
        r"\n    #modePanel \{[\s\S]*?(?=\n  </style>)",
        "\n" + CSS_EXTRA.rstrip() + "\n",
        html,
        count=1,
    )
    if ".mode-card {" not in html:
        html = html.replace(
            "    .err { color: #8b1e1e; padding: 1rem; }\n  </style>",
            "    .err { color: #8b1e1e; padding: 1rem; }\n" + CSS_EXTRA + "  </style>",
        )
    if ".btn-new-list" not in html:
        html = html.replace(
            "  </style>",
            CSS_EXTRA + "  </style>",
            1,
        )

    html, n = re.subn(r"  <header>[\s\S]*?</main>\n", BODY_HEADER + "\n", html, count=1)
    if n != 1:
        raise SystemExit(f"header replace failed n={n}")

    m = re.search(r"function setVersionLabel\(\)[\s\S]*?\nmain\(\);\n", html)
    if not m:
        # after strip, modes may already be gone — find main(); near end of script
        m = re.search(r"/\* === GET modes[\s\S]*?\nmain\(\);\n", html)
    if not m:
        m = re.search(r"(?:function parseQuery\(\)|function setVersionLabel\(\))[\s\S]*?\nmain\(\);\n", html)
    if not m:
        raise SystemExit("modes/main block not found")
    html = html[: m.start()] + modes + "\n" + main_js + "\n" + html[m.end() :]

    HTML.write_text(html, encoding="utf-8", newline="\n")
    print("patched", HTML, "bytes", HTML.stat().st_size)


if __name__ == "__main__":
    main()
