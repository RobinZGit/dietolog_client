#!/usr/bin/env python3
"""Добавить секцию БАД (кальций / железо / йод) в static.datasource.ts.

Конвенция для совместимости с формулой Angular:
  nutr += product.val * info.value / 100
Для БАД: product.val = число таблеток/капсул (шт.),
         info.value = доза_нутриента_в_1_шт * 100.

Компания по умолчанию — шаблон (замените COMPANY ниже).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DS = ROOT / "src" / "app" / "model" / "static.datasource.ts"

# Укажите бренд, когда будет выбран:
COMPANY = "БАД-шаблон"

# (name_suffix, nutrient_id, dose_per_unit, units_label)
# dose in same units as nutrient (мг/мкг)
BADS = [
    ("Йод 100 мкг", 29, 100, "мкг"),
    ("Йод 200 мкг", 29, 200, "мкг"),
    ("Кальций 500 мг", 19, 500, "мг"),
    ("Кальций 1000 мг", 19, 1000, "мг"),
    ("Железо 10 мг", 17, 10, "мг"),
    ("Железо 20 мг", 17, 20, "мг"),
    ("Селен 50 мкг", 38, 50, "мкг"),
    ("Витамин D 10 мкг", 12, 10, "мкг"),
]


def main():
    text = DS.read_text(encoding="utf-8")
    pm = re.search(r"private products: any =\n", text)
    prod_end = text.find("\n;\n", pm.end())
    products = json.loads(text[pm.end() : prod_end])
    im = re.search(r"private info: any = \[", text)
    info_start = text.find("[", im.start())
    info_end = text.rfind("]")
    info = json.loads(text[info_start : info_end + 1])

    max_pid = max(int(p["_id"]) for p in products)
    max_row = max(int(p.get("rownumber") or 0) for p in products)
    max_iid = max(int(i["_id"]) for i in info)

    # remove previous template BADs with same company prefix to allow re-run
    prefix = f"БАД · {COMPANY} ·"
    old_ids = {int(p["_id"]) for p in products if str(p.get("name", "")).startswith("БАД ·")}
    products = [p for p in products if int(p["_id"]) not in old_ids]
    info = [i for i in info if int(i["product"]) not in old_ids]

    new_products = []
    new_info = []
    pid = max_pid
    row = max_row
    iid = max_iid

    for title, nid, dose, ulabel in BADS:
        pid += 1
        row += 1
        iid += 1
        name = f"БАД · {COMPANY} · {title} · табл. (кол-во=шт.)"
        new_products.append(
            {
                "hint": f"БАД|{COMPANY}|{title}|на 1 табл.: {dose} {ulabel}|value=dose*100",
                "rownumber": row,
                "_id": pid,
                "name": name,
                "lowercase": name.lower(),
                "val": 0,
                "isrecommended": 0,
                "isnotrecommended": 0,
                "excluded": 0,
                "fastdegree": "БАД",
            }
        )
        # perc vs min_dailyrate: set roughly; recalcPerc will fix on init
        stored = dose * 100
        new_info.append(
            {
                "_id": iid,
                "product": pid,
                "nutrient": nid,
                "value": str(int(stored) if float(stored).is_integer() else stored),
                "perc1on100gr": "0",
            }
        )

    products.extend(new_products)
    info.extend(new_info)

    out_prod = []
    for i, p in enumerate(products):
        s = json.dumps(p, ensure_ascii=False, separators=(",", ":"))
        if i == 0:
            out_prod.append("[" + s + ",")
        elif i == len(products) - 1:
            out_prod.append(s + "]")
        else:
            out_prod.append(s + ",")
    prod_text = "\n".join(out_prod)

    def fmt_info(rows):
        parts = []
        for r in rows:
            parts.append(
                "  {\n"
                f'      "_id": {int(r["_id"])},\n'
                f'      "product": {int(r["product"])},\n'
                f'      "nutrient": {int(r["nutrient"])},\n'
                f'      "value": "{r["value"]}",\n'
                f'      "perc1on100gr": "{r["perc1on100gr"]}"\n'
                "  }"
            )
        return "[\n" + ",\n".join(parts) + "\n]"

    new_text = (
        text[: pm.end()]
        + prod_text
        + text[prod_end:info_start]
        + fmt_info(info)
        + text[info_end + 1 :]
    )
    DS.write_text(new_text, encoding="utf-8")
    print(f"company={COMPANY!r} added_products={len(new_products)} total_products={len(products)}")
    for p in new_products:
        print(" ", p["_id"], p["name"])


if __name__ == "__main__":
    main()
