#!/usr/bin/env python3
"""Добавить/перезаписать секцию БАД в static.datasource.ts.

Все БАДы: fastdegree='БАД', group='БАД' (без подразделов).

Конвенция для формулы Angular:
  nutr += product.val * info.value / 100
Для БАД: product.val = число таблеток (шт.),
         info.value = доза_в_1_шт * 100.

Фильтр Angular: fastdegree.startsWith('БАД') / === 'БАД'.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DS = ROOT / "src" / "app" / "model" / "static.datasource.ts"

COMPANY = "БАД-шаблон"

# (title, form_label, [(nutrient_id, dose, units), ...])
# form_label: табл. / капс. / бат. — кол-во всегда = шт.
# nutrient ids — see static.datasource nutrients / docs/NUTRIENT_SCALE_AUDIT.md
#
# Oils already in food catalog (do NOT duplicate as БАД):
#   рыбий жир, жир печени трески, оливковое, льняное, подсолнечное,
#   кунжутное, кокосовое, кукурузное, соевое, конопляное, горчичное…
# Missing as food → allowed as БАД: омега-3 капс./батончик, тыквенное,
#   виноградных косточек. Отдельного нутриента «Омега-3» в БД нет → Жиры + E.
BADS = [
    ("Йод 100 мкг", "табл.", [(29, 100, "мкг")]),
    ("Йод 200 мкг", "табл.", [(29, 200, "мкг")]),
    ("Кальций 500 мг", "табл.", [(19, 500, "мг")]),
    ("Кальций 1000 мг", "табл.", [(19, 1000, "мг")]),
    ("Железо 10 мг", "табл.", [(17, 10, "мг")]),
    ("Железо 20 мг", "табл.", [(17, 20, "мг")]),
    ("Селен 50 мкг", "табл.", [(38, 50, "мкг")]),
    ("Цинк 10 мг", "табл.", [(43, 10, "мг")]),
    ("Цинк 15 мг", "табл.", [(43, 15, "мг")]),
    ("Витамин D 10 мкг", "табл.", [(12, 10, "мкг")]),
    ("Витамин D 25 мкг", "табл.", [(12, 25, "мкг")]),
    ("Витамин C 100 мг", "табл.", [(11, 100, "мг")]),
    ("Витамин C 500 мг", "табл.", [(11, 500, "мг")]),
    ("Витамин C 1000 мг", "табл.", [(11, 1000, "мг")]),
    ("Витамин E 15 мг", "табл.", [(13, 15, "мг")]),
    ("Витамин A 800 мкг", "табл.", [(4, 800, "мкг")]),
    ("Витамин B1 2 мг", "табл.", [(5, 2, "мг")]),
    ("Витамин B2 2 мг", "табл.", [(6, 2, "мг")]),
    ("Витамин B6 2 мг", "табл.", [(8, 2, "мг")]),
    ("Витамин B9 400 мкг", "табл.", [(9, 400, "мкг")]),
    ("Витамин B12 5 мкг", "табл.", [(10, 5, "мкг")]),
    ("Витамин B12 10 мкг", "табл.", [(10, 10, "мкг")]),
    ("Витамин PP 20 мг", "табл.", [(15, 20, "мг")]),
    ("Витамин B5 5 мг", "табл.", [(52, 5, "мг")]),
    ("Магний 200 мг", "табл.", [(21, 200, "мг")]),
    ("Магний 400 мг", "табл.", [(21, 400, "мг")]),
    ("Магний B6 (Mg 50 мг + B6 5 мг)", "табл.", [(21, 50, "мг"), (8, 5, "мг")]),
    ("Магний B6 (Mg 100 мг + B6 10 мг)", "табл.", [(21, 100, "мг"), (8, 10, "мг")]),
    ("Калий 200 мг", "табл.", [(18, 200, "мг")]),
    ("Хром 200 мкг", "табл.", [(42, 200, "мкг")]),
    ("Кремний 10 мг", "табл.", [(20, 10, "мг")]),
    ("Кремний 20 мг", "табл.", [(20, 20, "мг")]),
    # oils / omega (only if not already a food product)
    ("Омега-3 1000 мг (EPA+DHA)", "капс.", [(1, 1, "г"), (13, 5, "мг")]),
    ("Омега-3 батончик", "бат.", [(1, 3, "г"), (13, 5, "мг")]),
    ("Тыквенное масло 1000 мг", "капс.", [(1, 1, "г"), (13, 3, "мг")]),
    ("Масло виноградных косточек 1000 мг", "капс.", [(1, 1, "г"), (13, 10, "мг")]),
]


def bracket_slice(text: str, start: int) -> tuple[str, int]:
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


def main() -> None:
    text = DS.read_text(encoding="utf-8")
    prod_eq = text.find("private products: any =\n")
    prod_arr = prod_eq + len("private products: any =\n")
    prod_json, prod_end = bracket_slice(text, prod_arr)
    products = json.loads(prod_json)

    info_start = text.find("private info: any =")
    info_arr = text.find("[", info_start)
    info_json, info_end = bracket_slice(text, info_arr)
    info = json.loads(info_json)

    old_ids = {
        int(p["_id"])
        for p in products
        if str(p.get("fastdegree", "")).startswith("БАД")
        or str(p.get("name", "")).startswith("БАД ·")
    }
    products = [p for p in products if int(p["_id"]) not in old_ids]
    info = [i for i in info if int(i["product"]) not in old_ids]
    # keep existing food `group` values (do not strip)

    max_pid = max(int(p["_id"]) for p in products)
    max_row = max(int(p.get("rownumber") or 0) for p in products)
    max_iid = max(int(i["_id"]) for i in info)
    pid, row, iid = max_pid, max_row, max_iid

    new_products = []
    new_info = []
    for title, form, nutrients in BADS:
        pid += 1
        row += 1
        name = f"БАД · {COMPANY} · {title} · {form} (кол-во=шт.)"
        dose_hint = "+".join(f"{d} {u}" for _, d, u in nutrients)
        new_products.append(
            {
                "hint": f"БАД|{COMPANY}|{title}|на 1 {form}: {dose_hint}|value=dose*100",
                "rownumber": row,
                "_id": pid,
                "name": name,
                "lowercase": name.lower(),
                "val": 0,
                "isrecommended": 0,
                "isnotrecommended": 0,
                "excluded": 0,
                "fastdegree": "БАД",
                "group": "БАД",
            }
        )
        for nid, dose, _ulabel in nutrients:
            iid += 1
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

    prod_out = (
        "[\n"
        + ",\n".join(json.dumps(p, ensure_ascii=False, separators=(",", ":")) for p in products)
        + "]"
    )

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
        text[:prod_arr]
        + prod_out
        + text[prod_end + 1 : info_arr]
        + fmt_info(info)
        + text[info_end + 1 :]
    )
    DS.write_text(new_text, encoding="utf-8")
    print(f"company={COMPANY!r} bads={len(new_products)} total={len(products)}")
    for p in new_products:
        print(" ", p["_id"], p["fastdegree"], p["name"])


if __name__ == "__main__":
    main()
