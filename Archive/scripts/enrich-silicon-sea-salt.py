#!/usr/bin/env python3
"""Add silicon-rich foods / sea salt; fill iodized salt minerals; silicon BADs.

Run from repo root or Archive:
  python Archive/scripts/enrich-silicon-sea-salt.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DS = ROOT / "src" / "app" / "model" / "static.datasource.ts"

SI = 20
# Nutrient ids used for salt copies
NA, CL, K, CA, MG, FE, ZN, MN, CU, P, S, I, SE = 22, 25, 18, 19, 21, 17, 43, 32, 33, 24, 23, 29, 38

# Existing product_id -> Si mg/100g (literature / RU tables, aligned with grain scale ~oats 10, rice 12.4)
# Only applied when missing or current value is lower.
SI_UPDATES: dict[int, float] = {
    # beer (barley → dissolved Si)
    10: 5.0,
    15: 5.0,
    16: 6.0,
    17: 7.0,
    1231: 6.0,
    1232: 4.5,
    # coffee (dry powder high; brew lower — store dry)
    42: 8.0,
    48: 6.0,
    49: 6.0,
    # processed cereals (raise under-scaled groats toward grain order)
    1166: 5.5,  # овсяная крупа
    1167: 4.0,  # толокно
    1147: 4.5,  # крупа рисовая
    1181: 3.5,  # мука рисовая
    1189: 5.0,  # ячмень лущеный
    1138: 2.5,  # каша гречневая
    1145: 2.2,
    1248: 2.2,
    1133: 2.0,  # мука гречихи
    1154: 2.0,  # мука кукурузная
    1177: 3.5,  # мука обойная
    # breads (whole-grain richer)
    162: 4.0,
    164: 3.5,  # бородинский
    165: 4.5,  # зерновой
    166: 5.0,  # грубая ржаная
    167: 4.5,  # овсяный
    172: 1.5,
    # legumes / veg
    1038: 3.5,  # фасоль стручок
    880: 3.0,
    881: 2.5,
    911: 2.5,  # капуста
    876: 2.0,  # брюссельская
    1013: 2.0,  # редис
    1031: 2.5,  # шпинат
    1032: 2.0,
    984: 2.5,  # огурец
    985: 2.0,
    986: 2.2,
    1022: 3.0,  # сельдерей
    1023: 2.5,
    1024: 2.5,
    1004: 4.0,  # петрушка
    1005: 3.0,
    1006: 8.0,
    1124: 10.0,  # петрушка сушеная
    1041: 3.0,  # укроп
    1128: 8.0,
    1016: 2.0,
    1017: 2.2,
    1019: 1.5,  # свекла
    972: 1.5,  # морковь
    1047: 1.2,  # тыква
    # fruit / dried
    779: 4.5,  # банан
    780: 4.0,
    781: 4.0,
    810: 6.0,  # изюм
    811: 5.5,
    812: 5.5,
    849: 5.0,  # финики
    778: 1.5,  # арбуз
    806: 2.0,  # дыня
    859: 1.2,  # яблоко
    784: 0.5,  # виноград (keep mild upgrade if lower)
    # seeds / nuts
    1089: 5.0,  # подсолнечник
    1090: 4.5,
    1092: 3.5,
    # mineral waters (mg/L ≈ mg/1000g → store as mg/100g for drink portion model)
    77: 1.5,  # Ессентуки (upgrade from 0.011)
}

# Extra nutrients for new solid foods (per 100g), rough food-table order
NEW_FOODS = [
    {
        "product": {
            "hint": "",
            "rownumber": 1285,
            "_id": 1285,
            "name": "Соль морская пищевая",
            "lowercase": "соль морская пищевая",
            "val": 0,
            "isrecommended": 0,
            "isnotrecommended": 0,
            "excluded": 0,
            "fastdegree": "сухоядение",
            "group": "Специи и приправы",
        },
        # vs table salt: slightly less Na, more Mg/K/Ca/Si/trace
        "nutrients": {
            NA: 37500,
            CL: 58500,
            K: 350,
            CA: 420,
            MG: 650,
            FE: 3.5,
            ZN: 1.2,
            MN: 0.4,
            CU: 0.3,
            P: 50,
            S: 120,
            I: 8.0,  # typically not iodized
            SI: 4.0,
            30: 12,  # if present on table salt (was 15) — keep id 30 from salt row
            34: 90,
        },
    },
    {
        "product": {
            "hint": "",
            "rownumber": 1286,
            "_id": 1286,
            "name": "Отруби овсяные",
            "lowercase": "отруби овсяные",
            "val": 0,
            "isrecommended": 0,
            "isnotrecommended": 0,
            "excluded": 0,
            "fastdegree": "сухоядение",
            "group": "Зерновые и хлеб",
        },
        "nutrients": {
            3: 246,  # kcal
            0: 17,
            1: 7,
            2: 66,
            46: 15,
            SI: 14.0,
            K: 566,
            MG: 235,
            P: 734,
            FE: 5.4,
            ZN: 3.1,
            MN: 5.6,
        },
    },
    {
        "product": {
            "hint": "",
            "rownumber": 1287,
            "_id": 1287,
            "name": "Отруби пшеничные",
            "lowercase": "отруби пшеничные",
            "val": 0,
            "isrecommended": 0,
            "isnotrecommended": 0,
            "excluded": 0,
            "fastdegree": "сухоядение",
            "group": "Зерновые и хлеб",
        },
        "nutrients": {
            3: 216,
            0: 16,
            1: 4.3,
            2: 65,
            46: 43,
            SI: 12.0,
            K: 1182,
            MG: 611,
            P: 1013,
            FE: 10.6,
            ZN: 7.3,
            MN: 11.9,
        },
    },
    {
        "product": {
            "hint": "",
            "rownumber": 1288,
            "_id": 1288,
            "name": "Рис бурый, крупа",
            "lowercase": "рис бурый крупа",
            "val": 0,
            "isrecommended": 0,
            "isnotrecommended": 0,
            "excluded": 0,
            "fastdegree": "сухоядение",
            "group": "Зерновые и хлеб",
        },
        "nutrients": {
            3: 370,
            0: 7.5,
            1: 2.7,
            2: 77,
            46: 3.5,
            SI: 8.5,
            K: 250,
            MG: 140,
            P: 300,
            FE: 1.5,
            ZN: 2.0,
            MN: 3.5,
        },
    },
    {
        "product": {
            "hint": "травяной чай / настой; высокий кремний",
            "rownumber": 1289,
            "_id": 1289,
            "name": "Хвощ полевой, трава сушёная",
            "lowercase": "хвощ полевой трава сушеная",
            "val": 0,
            "isrecommended": 0,
            "isnotrecommended": 0,
            "excluded": 0,
            "fastdegree": "сухоядение",
            "group": "Специи и приправы",
        },
        "nutrients": {
            3: 180,
            0: 5,
            2: 40,
            46: 25,
            SI: 25.0,
            K: 800,
            CA: 600,
            MG: 200,
            FE: 8.0,
        },
    },
    {
        "product": {
            "hint": "",
            "rownumber": 1290,
            "_id": 1290,
            "name": "Киноа, зерно",
            "lowercase": "киноа зерно",
            "val": 0,
            "isrecommended": 0,
            "isnotrecommended": 0,
            "excluded": 0,
            "fastdegree": "сухоядение",
            "group": "Зерновые и хлеб",
        },
        "nutrients": {
            3: 368,
            0: 14,
            1: 6,
            2: 64,
            46: 7,
            SI: 6.0,
            K: 563,
            MG: 197,
            P: 457,
            FE: 4.6,
            ZN: 3.1,
            MN: 2.0,
        },
    },
]

SILICON_BADS = [
    ("Кремний 10 мг", "табл.", [(SI, 10, "мг")]),
    ("Кремний 20 мг", "табл.", [(SI, 20, "мг")]),
]

COMPANY = "БАД-шаблон"


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


def fmt_info(rows: list) -> str:
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


def val_str(v: float) -> str:
    if float(v).is_integer():
        return str(int(v))
    return str(round(v, 3)).rstrip("0").rstrip(".")


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

    by_prod = {int(p["_id"]): p for p in products}
    # (product, nutrient) -> row
    idx = {(int(r["product"]), int(r["nutrient"])): r for r in info}
    max_iid = max(int(r["_id"]) for r in info)
    max_pid = max(int(p["_id"]) for p in products)
    max_row = max(int(p.get("rownumber") or 0) for p in products)

    def upsert(pid: int, nid: int, value: float, *, only_if_missing_or_lower: bool = True) -> str:
        nonlocal max_iid
        key = (pid, nid)
        if key in idx:
            old = float(idx[key]["value"])
            if only_if_missing_or_lower and old >= value:
                return "skip"
            idx[key]["value"] = val_str(value)
            return "upd"
        max_iid += 1
        row = {
            "_id": max_iid,
            "product": pid,
            "nutrient": nid,
            "value": val_str(value),
            "perc1on100gr": "0",
        }
        info.append(row)
        idx[key] = row
        return "add"

    si_add = si_upd = si_skip = 0
    for pid, val in SI_UPDATES.items():
        if pid not in by_prod:
            continue
        r = upsert(pid, SI, val)
        if r == "add":
            si_add += 1
        elif r == "upd":
            si_upd += 1
        else:
            si_skip += 1

    # Copy table-salt minerals onto iodized salt (keep higher iodine)
    salt_rows = [r for r in info if int(r["product"]) == 1097]
    iod_copied = 0
    if 1249 in by_prod:
        for r in salt_rows:
            nid = int(r["nutrient"])
            if nid == I:
                continue  # keep USDA iodized iodine
            v = float(r["value"])
            key = (1249, nid)
            if key not in idx:
                upsert(1249, nid, v, only_if_missing_or_lower=False)
                iod_copied += 1
            elif float(idx[key]["value"]) <= 0:
                upsert(1249, nid, v, only_if_missing_or_lower=False)
                iod_copied += 1
        # ensure Si on table salt too (trace)
        upsert(1097, SI, 1.5)
        upsert(1249, SI, 1.5)

    new_food_n = 0
    for item in NEW_FOODS:
        p = item["product"]
        pid = int(p["_id"])
        if pid not in by_prod:
            products.append(p)
            by_prod[pid] = p
            new_food_n += 1
            max_pid = max(max_pid, pid)
            max_row = max(max_row, int(p.get("rownumber") or 0))
        for nid, val in item["nutrients"].items():
            upsert(pid, int(nid), float(val), only_if_missing_or_lower=False)

    # Silicon BADs (append if name not present)
    existing_bad_titles = {
        p["name"] for p in products if str(p.get("fastdegree", "")).startswith("БАД")
    }
    bad_n = 0
    for title, form, nutrients in SILICON_BADS:
        name = f"БАД · {COMPANY} · {title} · {form} (кол-во=шт.)"
        if name in existing_bad_titles:
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
        by_prod[max_pid] = products[-1]
        for nid, dose, _u in nutrients:
            upsert(max_pid, nid, dose * 100, only_if_missing_or_lower=False)
        bad_n += 1

    # Ensure group on iodized salt
    if 1249 in by_prod and not by_prod[1249].get("group"):
        by_prod[1249]["group"] = "Специи и приправы"

    prod_out = (
        "[\n"
        + ",\n".join(json.dumps(p, ensure_ascii=False, separators=(",", ":")) for p in products)
        + "]"
    )
    new_text = (
        text[:prod_arr]
        + prod_out
        + text[prod_end + 1 : info_arr]
        + fmt_info(info)
        + text[info_end + 1 :]
    )
    DS.write_text(new_text, encoding="utf-8")
    print(
        f"Si add={si_add} upd={si_upd} skip={si_skip}; "
        f"iodized mineral rows copied~{iod_copied}; "
        f"new foods={new_food_n}; silicon BADs={bad_n}; products={len(products)}"
    )


if __name__ == "__main__":
    main()
