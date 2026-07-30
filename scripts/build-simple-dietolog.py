#!/usr/bin/env python3
"""Пересобрать simple/seed.json и simple/dietolog.html из static.datasource.ts.

У всех продуктов поле group (пищевые группы / БАД · …).
В UI: группа → продукт → нутриенты (ленивая подгрузка продуктов).
"""
from __future__ import annotations

import json
import pathlib
import re
import sys
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "app" / "model" / "static.datasource.ts"
OUT_DIR = ROOT / "simple"
SEED_PATH = OUT_DIR / "seed.json"
HTML_PATH = OUT_DIR / "dietolog.html"
VERSION = 16
SOURCE = "dietolog_client · v16 rec above nutrients; new list local offline"
CHUNK = 120000


def bracket_slice(text: str, start: int) -> tuple[str, int]:
    """Return JSON array text starting at text[start]=='[' and end index of ']'."""
    assert text[start] == "["
    depth = 0
    in_str = False
    esc = False
    for i, c in enumerate(text[start:], start):
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
            continue
        if c == '"':
            in_str = True
            continue
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return text[start : i + 1], i
    raise ValueError("unclosed array")


def extract() -> dict:
    text = SRC.read_text(encoding="utf-8")

    nutr_start = text.find("private nutrients")
    nutr_arr = text.find("[", nutr_start)
    prod_decl = text.find("private products: any =")
    nutr_text = text[nutr_arr:prod_decl]
    nutrients = []
    for m in re.finditer(r"\{[^{}]*\}", nutr_text):
        try:
            o = json.loads(m.group(0))
            if "_id" in o and "name" in o:
                nutrients.append(
                    {
                        "id": int(o["_id"]),
                        "name": o["name"],
                        "units": o.get("units", ""),
                        "min": o.get("min_dailyrate"),
                        "max": o.get("max_dailyrate"),
                    }
                )
        except Exception:
            pass

    prod_eq = text.find("private products: any =\n")
    prod_arr = prod_eq + len("private products: any =\n")
    prod_json, _ = bracket_slice(text, prod_arr)
    raw_products = json.loads(prod_json)

    info_start = text.find("private info: any =")
    info_arr = text.find("[", info_start)
    info_json, _ = bracket_slice(text, info_arr)
    info_rows = json.loads(info_json)

    by_prod: dict[int, list] = defaultdict(list)
    for r in info_rows:
        v = float(r["value"])
        if v == 0:
            continue
        by_prod[int(r["product"])].append([int(r["nutrient"]), v])
    for pid in by_prod:
        by_prod[pid].sort(key=lambda x: -x[1])

    products = []
    for p in raw_products:
        fd = p.get("fastdegree") or ""
        is_bad = str(fd).startswith("БАД") or p.get("group") == "БАД"
        group = "БАД" if is_bad else (p.get("group") or "Прочее")
        products.append(
            {
                "id": int(p["_id"]),
                "name": p["name"],
                "section": "bad" if is_bad else "food",
                "fastdegree": "БАД" if is_bad else fd,
                "group": group,
            }
        )

    return {
        "version": VERSION,
        "source": SOURCE,
        "nutrients": nutrients,
        "products": products,
        "info": {str(k): v for k, v in by_prod.items()},
    }


def inject_seed_into_html(seed: dict) -> None:
    if not HTML_PATH.exists():
        raise SystemExit(f"HTML missing: {HTML_PATH}")
    html = HTML_PATH.read_text(encoding="utf-8")
    seed_json = json.dumps(seed, ensure_ascii=False, separators=(",", ":"))
    chunks = [seed_json[i : i + CHUNK] for i in range(0, len(seed_json), CHUNK)]
    chunks_js = ",\n".join(json.dumps(c, ensure_ascii=False) for c in chunks)
    new_block = "const SEED = JSON.parse(\n[\n" + chunks_js + '\n].join("")\n);'
    m = re.search(
        r"const SEED = JSON\.parse\(\s*\[[\s\S]*?\]\.join\(\"\"\)\s*\);",
        html,
    )
    if not m:
        raise SystemExit("SEED block not found in HTML")
    html = html[: m.start()] + new_block + html[m.end() :]
    html = re.sub(
        r"(Диетолог — простой )v\d+",
        rf"\g<1>v{VERSION}",
        html,
    )
    html = re.sub(
        r'(id="appVersion" class="ver">)v\d+',
        rf"\g<1>v{VERSION}",
        html,
    )
    html = re.sub(r"const DB_VERSION = \d+;", f"const DB_VERSION = {VERSION};", html)
    HTML_PATH.write_text(html, encoding="utf-8")


def main() -> int:
    if not SRC.exists():
        print("missing", SRC, file=sys.stderr)
        return 1
    seed = extract()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    SEED_PATH.write_text(
        json.dumps(seed, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print("wrote", SEED_PATH, "bytes", SEED_PATH.stat().st_size)
    print(
        "nutrients",
        len(seed["nutrients"]),
        "products",
        len(seed["products"]),
        "bad",
        sum(1 for p in seed["products"] if p.get("section") == "bad"),
    )
    inject_seed_into_html(seed)
    print("updated", HTML_PATH, "bytes", HTML_PATH.stat().st_size)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
