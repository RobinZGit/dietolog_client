#!/usr/bin/env python3
"""Пересобрать simple/seed.json и simple/dietolog.html из static.datasource.ts."""
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
TEMPLATE_MARK = "/*__SEED__*/"


def extract() -> dict:
    lines = SRC.read_text(encoding="utf-8").readlines()
    nutr_text = "".join(lines[105:643])
    prod_text = "".join(lines[643:1892])
    info_text = "".join(lines[1892:])

    nutrients = []
    for m in re.finditer(r"\{[\s\S]*?\}", nutr_text):
        try:
            o = json.loads(m.group(0))
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

    products = []
    for m in re.finditer(r"\{[^}]+\}", prod_text):
        try:
            o = json.loads(m.group(0))
            products.append({"id": int(o["_id"]), "name": o["name"]})
        except Exception:
            pass

    arr = info_text[info_text.find("[") :]
    arr = arr[: arr.rfind("]") + 1]
    info_rows = json.loads(arr)
    by_prod: dict[int, list] = defaultdict(list)
    for r in info_rows:
        v = float(r["value"])
        if v == 0:
            continue
        by_prod[int(r["product"])].append([int(r["nutrient"]), v])
    for pid in by_prod:
        by_prod[pid].sort(key=lambda x: -x[1])

    return {
        "version": 1,
        "source": "dietolog_client static.datasource.ts",
        "nutrients": nutrients,
        "products": products,
        "info": {str(k): v for k, v in by_prod.items()},
    }


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

    if not HTML_PATH.exists():
        print("HTML missing; generate dietolog.html first", file=sys.stderr)
        return 1

    html = HTML_PATH.read_text(encoding="utf-8")
    # Replace const SEED = {...};
    m = re.search(r"const SEED = \{.*?\n\};", html, flags=re.S)
    if not m:
        print("SEED block not found in HTML", file=sys.stderr)
        return 1
    new_block = "const SEED = " + json.dumps(seed, ensure_ascii=False, separators=(",", ":")) + ";"
    HTML_PATH.write_text(html[: m.start()] + new_block + html[m.end() :], encoding="utf-8")
    print("updated", HTML_PATH, "bytes", HTML_PATH.stat().st_size)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
