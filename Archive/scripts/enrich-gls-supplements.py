#!/usr/bin/env python3
"""Add GLS Pharmaceuticals БАДы missing from the catalog.

Keeps existing «БАД-шаблон» entries. Values = dose per 1 capsule/tablet
(Angular: nutr += qty * value / 100 → store dose*100).

Sources: GLS / pharmacy labels (zdravcity, energy-body, apteka).
Then rebuild: python Archive/scripts/build-simple-dietolog.py
"""
from __future__ import annotations

import json
import pathlib

ARCHIVE = pathlib.Path(__file__).resolve().parents[1]
DS = ARCHIVE / "src" / "app" / "model" / "static.datasource.ts"

COMPANY = "GLS"

# Nutrient ids
FAT, PROT = 1, 0
K, CA, MG = 18, 19, 21
FE, ZN, MN, CU = 17, 43, 32, 33
I, SE, CR, MO = 29, 38, 42, 34
A, B1, B2, B3, B6, B9, B12 = 4, 5, 6, 7, 8, 9, 10
C, D, E, H, PP, B4, B5 = 11, 12, 13, 14, 15, 16, 52


def bracket_slice(text: str, start: int) -> tuple[str, int]:
    assert text[start] == "["
    depth = 0
    in_str = esc = False
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


def fmt_info(rows: list) -> str:
    return (
        "[\n"
        + ",\n".join(json.dumps(r, ensure_ascii=False, separators=(",", ":")) for r in rows)
        + "]"
    )


# (title, form, [(nutrient_id, dose_per_1_шт, units_label), ...])
# Doses are per ONE capsule (serving ÷ capsules in serving).
GLS_BADS: list[tuple[str, str, list[tuple[int, float, str]]]] = [
    # --- singles / focused ---
    ("Витамин D3 2000 МЕ", "капс.", [(D, 50, "мкг")]),
    ("Витамин C 900 (450 мг)", "капс.", [(C, 450, "мг")]),
    ("Цинк хелат 25 мг", "капс.", [(ZN, 25, "мг")]),
    ("Железо хелат 40 мг", "капс.", [(FE, 40, "мг")]),
    ("Селен 100 мкг", "капс.", [(SE, 100, "мкг")]),
    (
        "Магний хелат 100 мг",
        "капс.",
        [(MG, 100, "мг")],  # 400 мг / 4 капс.
    ),
    (
        "Магний цитрат + B6",
        "капс.",
        [(MG, 100, "мг"), (B6, 1.5, "мг")],  # 400+6 / 4 капс.
    ),
    (
        "Калий + Магний",
        "капс.",
        [(K, 110, "мг"), (MG, 50, "мг")],  # 440+200 / 4 капс.
    ),
    (
        "Кальций+Магний+Цинк+D3",
        "капс.",
        [
            (CA, 200, "мг"),
            (MG, 50, "мг"),
            (ZN, 3.75, "мг"),
            (D, 3.75, "мкг"),
        ],  # / 4 капс.
    ),
    (
        "Омега-3 (EPA+DHA)",
        "капс.",
        [(FAT, 0.45, "г"), (E, 2.5, "мг")],  # ~900 мг омега / 2 капс.
    ),
    (
        "Омега-3 + витамин D3",
        "капс.",
        [(FAT, 0.5, "г"), (D, 7.5, "мкг"), (E, 2.5, "мг")],  # жиры 1 г + D 15 мкг / 2
    ),
    (
        "Коллаген + гиалурон + витамин C",
        "капс.",
        [(PROT, 0.35, "г"), (C, 33.5, "мг")],  # 1050 мг коллагена + 100.5 мг C / 3
    ),
    # --- complexes ---
    (
        "Витамины для беременных",
        "капс.",
        [
            (C, 100, "мг"),
            (D, 15, "мкг"),
            (B1, 1.7, "мг"),
            (B2, 2, "мг"),
            (B3, 20, "мг"),
            (PP, 20, "мг"),
            (B5, 6, "мг"),
            (B6, 2, "мг"),
            (B9, 500, "мкг"),
            (B12, 3, "мкг"),
            (H, 50, "мкг"),
            (FE, 30, "мг"),
            (ZN, 15, "мг"),
            (CU, 1, "мг"),
            (I, 220, "мкг"),
            (SE, 50, "мкг"),
        ],
    ),
    (
        "Женская формула",
        "капс.",
        [  # суточная = 2 капс. → на 1 капс. половина
            (B4, 11, "мг"),
            (A, 415, "мкг"),
            (D, 3, "мкг"),
            (E, 1.35, "мг"),
            (C, 23, "мг"),
            (B1, 0.43, "мг"),
            (B2, 0.43, "мг"),
            (B3, 5.4, "мг"),
            (PP, 5.4, "мг"),
            (B5, 2, "мг"),
            (B6, 0.53, "мг"),
            (B9, 150, "мкг"),
            (B12, 0.9, "мкг"),
            (H, 55.5, "мкг"),
            (CA, 13, "мг"),
            (K, 1.35, "мг"),
            (MG, 10.5, "мг"),
            (ZN, 5.3, "мг"),
            (FE, 7, "мг"),
            (MN, 1, "мг"),
            (CU, 0.26, "мг"),
            (I, 99, "мкг"),
            (CR, 13, "мкг"),
            (MO, 13, "мкг"),
            (SE, 13, "мкг"),
        ],
    ),
    (
        "Витамины 50 плюс",
        "капс.",
        [  # суточная = 2 капс.
            (A, 375, "мкг"),
            (D, 7.5, "мкг"),
            (E, 5, "мг"),
            (C, 45, "мг"),
            (B1, 0.75, "мг"),
            (ZN, 6, "мг"),
            (FE, 5, "мг"),
            (CU, 0.5, "мг"),
            (CR, 25, "мкг"),
            (I, 50, "мкг"),
            (SE, 25, "мкг"),
            (MG, 10, "мг"),
            (CA, 25, "мг"),
        ],
    ),
    (
        "Мультивитамины для детей с 7 лет",
        "капс.",
        [
            (A, 250, "мкг"),
            (D, 5.5, "мкг"),
            (E, 4.5, "мг"),
            (C, 50, "мг"),
            (B1, 1.1, "мг"),
            (B2, 1.25, "мг"),
            (B3, 15, "мг"),
            (PP, 15, "мг"),
            (B5, 2.9, "мг"),
            (B6, 1.4, "мг"),
            (B9, 225, "мкг"),
            (B12, 1.6, "мкг"),
            (H, 19, "мкг"),
            (CA, 6.75, "мг"),
            (K, 0.675, "мг"),
            (MG, 5.4, "мг"),
            (FE, 5, "мг"),
            (ZN, 2.7, "мг"),
            (MN, 0.54, "мг"),
            (CU, 0.15, "мг"),
            (I, 50, "мкг"),
            (SE, 6.75, "мкг"),
            (CR, 6.75, "мкг"),
        ],
    ),
]


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

    existing = {p["name"] for p in products}
    max_pid = max(int(p["_id"]) for p in products)
    max_row = max(int(p.get("rownumber") or 0) for p in products)
    max_iid = max(int(i["_id"]) for i in info)

    added = 0
    for title, form, nutrients in GLS_BADS:
        name = f"БАД · {COMPANY} · {title} · {form} (кол-во=шт.)"
        if name in existing:
            print("skip existing", name)
            continue
        max_pid += 1
        max_row += 1
        dose_hint = "+".join(f"{d} {u}" for _, d, u in nutrients)
        products.append(
            {
                "hint": f"БАД|{COMPANY}|{title}|на 1 {form}: {dose_hint}|value=dose*100",
                "rownumber": max_row,
                "_id": max_pid,
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
        existing.add(name)
        for nid, dose, _u in nutrients:
            max_iid += 1
            stored = dose * 100
            info.append(
                {
                    "_id": max_iid,
                    "product": max_pid,
                    "nutrient": int(nid),
                    "value": str(int(stored) if float(stored).is_integer() else stored),
                    "perc1on100gr": "0",
                }
            )
        added += 1
        print("+", max_pid, name)

    for i, row in enumerate(info, start=1):
        row["_id"] = i
        row["rownumber"] = i
        if "perc1on100gr" not in row:
            row["perc1on100gr"] = "0"
        # keep BAD convention: string values; foods may already be numeric
        if isinstance(row.get("value"), (int, float)):
            v = float(row["value"])
            row["value"] = str(int(v) if v.is_integer() else v)

    prod_out = (
        "[\n"
        + ",\n".join(json.dumps(p, ensure_ascii=False, separators=(",", ":")) for p in products)
        + "]"
    )
    new_text = (
        text[:prod_arr] + prod_out + text[prod_end + 1 : info_arr] + fmt_info(info) + text[info_end + 1 :]
    )
    DS.write_text(new_text, encoding="utf-8")
    print(f"added={added} products_total={len(products)} info_rows={len(info)}")


if __name__ == "__main__":
    main()
