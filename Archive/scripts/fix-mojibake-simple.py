# -*- coding: utf-8 -*-
"""Fix mojibake in simple/dietolog.html header only (ASCII-safe)."""
from __future__ import annotations

import pathlib
import re

ARCHIVE = pathlib.Path(__file__).resolve().parents[1]
REPO = ARCHIVE.parent
HTML = REPO / "dietolog.html"

BODY = (
    "  <header>\n"
    "    <h1>\u0414\u0438\u0435\u0442\u043e\u043b\u043e\u0433 "
    '<span style="font-weight:500;color:var(--muted);font-size:0.75em">'
    "\u043f\u0440\u043e\u0441\u0442\u043e\u0439</span> "
    '<span id="appVersion" class="ver">v19</span></h1>\n'
    '    <p class="lead" id="leadText">'
    "\u041f\u043e\u0438\u0441\u043a \u2192 <b>\u0433\u0440\u0443\u043f\u043f\u0430</b> \u2192 "
    "\u043f\u0440\u043e\u0434\u0443\u043a\u0442 \u2192 \u043d\u0443\u0442\u0440\u0438\u0435\u043d\u0442\u044b. "
    "\u0412\u0441\u0435 \u0411\u0410\u0414\u044b \u0432 \u043e\u0434\u043d\u043e\u0439 \u0433\u0440\u0443\u043f\u043f\u0435 "
    "<b>\u0411\u0410\u0414</b>.</p>\n"
    "  </header>\n"
    '  <div id="modePanel"></div>\n'
    '  <div class="toolbar" id="toolbar">\n'
    '    <input id="q" type="search" placeholder="'
    "\u041f\u043e\u0438\u0441\u043a \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u0430 \u0438\u043b\u0438 \u0433\u0440\u0443\u043f\u043f\u044b\u2026"
    '" autocomplete="off" />\n'
    '    <div id="status">\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430\u2026</div>\n'
    "  </div>\n"
    '  <p class="browse-title" id="browseTitle">'
    "\u0421\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u043e\u0432</p>\n"
    "  <main>\n"
    '    <div id="list" class="list"><div class="loading">'
    "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0433\u0440\u0443\u043f\u043f\u2026"
    "</div></div>\n"
    "  </main>\n"
)

TITLE_OK = (
    "<title>\u0414\u0438\u0435\u0442\u043e\u043b\u043e\u0433 \u2014 "
    "\u043f\u0440\u043e\u0441\u0442\u043e\u0439 v19</title>"
)


def main() -> None:
    html = HTML.read_text(encoding="utf-8")
    html2, n = re.subn(r"  <header>[\s\S]*?</main>\n", BODY + "\n", html, count=1)
    if n != 1:
        raise SystemExit(f"header replace failed n={n}")
    html2 = re.sub(r"<title>.*?</title>", TITLE_OK, html2, count=1)
    HTML.write_text(html2, encoding="utf-8", newline="\n")
    h1 = re.search(r"<h1>([^<]+)", html2).group(1)
    assert h1.startswith("\u0414\u0438\u0435\u0442\u043e\u043b\u043e\u0433"), h1[:20]
    print("header OK")


if __name__ == "__main__":
    main()
