#!/usr/bin/env python3
"""Add dried vegetables missing from the catalog (carrot, bell pepper, etc.).

Updates Archive/src/app/model/static.datasource.ts
Then rebuild with: python Archive/scripts/build-simple-dietolog.py
"""
from __future__ import annotations

import json
import pathlib

ARCHIVE = pathlib.Path(__file__).resolve().parents[1]
DS = ARCHIVE / "src" / "app" / "model" / "static.datasource.ts"

# Nutrient ids (same as seed)
KCAL, CARB, FAT, PROT = 3, 2, 1, 0
SUGAR, FIBER, STARCH = 45, 46, 53
NA, CL, K, S, P, CA, MG = 22, 25, 18, 23, 24, 19, 21
FE, ZN, MN, CU, I, SE, SI = 17, 43, 32, 33, 29, 38, 20
B1, B2, B3, B6, B9, B5, C, E, A, PP = 5, 6, 7, 8, 9, 52, 11, 13, 4, 15


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


def product(pid: int, row: int, name: str, group: str = "Овощи", fastdegree: str = "сухоядение") -> dict:
    return {
        "hint": "",
        "rownumber": row,
        "_id": pid,
        "name": name,
        "lowercase": name.lower(),
        "val": 0,
        "isrecommended": 0,
        "isnotrecommended": 0,
        "excluded": 0,
        "fastdegree": fastdegree,
        "group": group,
    }


# Values per 100 g — USDA dehydrated vegetables / Russian food tables / labels (rounded).
# Scales match existing dried potato / onion powder entries in this DB.
NEW_FOODS: list[dict] = [
    {
        "product": product(0, 0, "Морковь сушёная"),
        "nutrients": {
            KCAL: 341, PROT: 8.1, FAT: 1.5, CARB: 79.6, FIBER: 23.6, SUGAR: 38.8, STARCH: 8.0,
            CA: 212, P: 346, MG: 118, K: 2540, NA: 275, FE: 3.9, ZN: 1.8, MN: 1.1,
            CU: 0.4, SE: 2.5, B1: 0.5, B2: 0.35, PP: 4.0, B6: 0.9, B9: 55, B5: 1.5,
            C: 14.6, E: 3.5, A: 8500,
        },
    },
    {
        "product": product(0, 0, "Перец сладкий сушёный"),
        "nutrients": {
            KCAL: 314, PROT: 10.4, FAT: 3.0, CARB: 68.0, FIBER: 21.0, SUGAR: 38.0,
            CA: 120, P: 280, MG: 150, K: 2200, NA: 30, CL: 45, FE: 6.5, ZN: 1.5, MN: 1.2,
            CU: 0.5, I: 15.0, SE: 3.0, B1: 0.4, B2: 0.9, PP: 5.0, B6: 2.5, B9: 100,
            C: 190.0, E: 8.0, A: 2500,
        },
    },
    {
        "product": product(0, 0, "Лук репчатый сушёный"),
        "nutrients": {
            KCAL: 349, PROT: 9.0, FAT: 0.5, CARB: 80.0, FIBER: 9.0, SUGAR: 37.0,
            CA: 257, P: 300, MG: 100, K: 1620, NA: 50, FE: 2.0, ZN: 1.5, MN: 1.2,
            CU: 0.4, SE: 5.0, B1: 0.35, B2: 0.1, PP: 0.8, B6: 1.0, B9: 50, B5: 1.0,
            C: 40.0, E: 0.5,
        },
    },
    {
        "product": product(0, 0, "Свёкла сушёная"),
        "nutrients": {
            KCAL: 320, PROT: 10.0, FAT: 0.8, CARB: 70.0, FIBER: 18.0, SUGAR: 55.0,
            CA: 250, P: 300, MG: 150, K: 2000, NA: 320, CL: 300, FE: 8.0, ZN: 2.5, MN: 3.5,
            CU: 0.8, I: 40.0, SI: 10.0, B1: 0.15, B2: 0.25, PP: 1.2, B6: 0.5, B9: 80,
            C: 20.0, E: 0.8, A: 10,
        },
    },
    {
        "product": product(0, 0, "Капуста белокочанная сушёная"),
        "nutrients": {
            KCAL: 280, PROT: 14.0, FAT: 1.0, CARB: 55.0, FIBER: 22.0, SUGAR: 35.0,
            CA: 400, P: 250, MG: 130, K: 2300, NA: 100, CL: 280, FE: 5.0, ZN: 2.5, MN: 1.3,
            CU: 0.5, I: 20.0, SI: 18.0, B1: 0.25, B2: 0.3, PP: 4.0, B6: 0.8, B9: 150,
            C: 120.0, E: 0.8, A: 20,
        },
    },
    {
        "product": product(0, 0, "Томаты вяленые"),
        "nutrients": {
            KCAL: 258, PROT: 14.1, FAT: 3.0, CARB: 55.8, FIBER: 12.3, SUGAR: 37.6,
            CA: 110, P: 356, MG: 194, K: 3427, NA: 266, FE: 9.1, ZN: 2.0, MN: 1.1,
            CU: 0.9, SE: 5.5, B1: 0.5, B2: 0.5, PP: 9.0, B6: 0.3, B9: 68, B5: 2.0,
            C: 39.0, E: 0.0, A: 700,
        },
    },
    {
        "product": product(0, 0, "Кабачок сушёный"),
        "nutrients": {
            KCAL: 290, PROT: 8.0, FAT: 2.0, CARB: 60.0, FIBER: 18.0, SUGAR: 40.0,
            CA: 150, P: 200, MG: 120, K: 2500, NA: 20, FE: 3.5, ZN: 1.5, MN: 0.8,
            CU: 0.4, B1: 0.3, B2: 0.3, PP: 4.0, B6: 0.9, B9: 100, C: 50.0, E: 1.0, A: 40,
        },
    },
    {
        "product": product(0, 0, "Баклажан сушёный"),
        "nutrients": {
            KCAL: 280, PROT: 10.0, FAT: 1.5, CARB: 58.0, FIBER: 25.0, SUGAR: 30.0,
            CA: 140, P: 280, MG: 90, K: 2200, NA: 50, CL: 400, FE: 3.5, ZN: 2.0, MN: 1.5,
            CU: 0.9, B1: 0.3, B2: 0.35, PP: 4.0, B6: 1.0, B9: 120, C: 15.0, E: 0.8, A: 20,
        },
    },
    {
        "product": product(0, 0, "Тыква сушёная"),
        "nutrients": {
            KCAL: 300, PROT: 10.0, FAT: 1.0, CARB: 65.0, FIBER: 18.0, SUGAR: 40.0, STARCH: 5.0,
            CA: 200, P: 220, MG: 120, K: 1800, NA: 30, CL: 150, FE: 3.5, ZN: 2.0, MN: 0.4,
            CU: 1.2, I: 8.0, SI: 10.0, B1: 0.4, B2: 0.5, PP: 3.5, B6: 1.0, B9: 100, B5: 2.5,
            C: 30.0, E: 3.5, A: 1200,
        },
    },
    {
        "product": product(0, 0, "Сельдерей сушёный"),
        "nutrients": {
            KCAL: 270, PROT: 11.0, FAT: 2.0, CARB: 50.0, FIBER: 20.0, SUGAR: 20.0,
            CA: 500, P: 300, MG: 200, K: 3500, NA: 800, FE: 8.0, ZN: 2.0, MN: 2.0,
            CU: 0.5, B1: 0.3, B2: 0.4, PP: 3.0, B6: 0.8, B9: 120, C: 40.0, E: 2.0, A: 150,
        },
    },
    {
        "product": product(0, 0, "Шпинат сушёный"),
        "nutrients": {
            KCAL: 290, PROT: 28.0, FAT: 3.5, CARB: 35.0, FIBER: 20.0, SUGAR: 4.0,
            CA: 1000, P: 500, MG: 700, K: 3500, NA: 200, FE: 25.0, ZN: 5.0, MN: 6.0,
            CU: 1.2, SI: 20.0, B1: 0.6, B2: 1.5, PP: 5.0, B6: 1.0, B9: 600, B5: 1.5,
            C: 100.0, E: 20.0, A: 3500,
        },
    },
    {
        "product": product(0, 0, "Брокколи сушёная"),
        "nutrients": {
            KCAL: 300, PROT: 25.0, FAT: 3.0, CARB: 45.0, FIBER: 22.0, SUGAR: 15.0,
            CA: 400, P: 500, MG: 200, K: 2800, NA: 150, FE: 8.0, ZN: 4.0, MN: 2.0,
            CU: 0.6, SE: 8.0, B1: 0.5, B2: 0.8, PP: 5.0, B6: 1.2, B9: 400, C: 400.0, E: 4.0, A: 200,
        },
    },
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
    # also treat ё/е variants as duplicates
    existing_norm = {n.replace("ё", "е").lower() for n in existing}
    max_pid = max(int(p["_id"]) for p in products)
    max_row = max(int(p.get("rownumber") or 0) for p in products)

    added = 0
    for item in NEW_FOODS:
        name = item["product"]["name"]
        if name in existing or name.replace("ё", "е").lower() in existing_norm:
            print("skip existing", name)
            continue
        max_pid += 1
        max_row += 1
        p = dict(item["product"])
        p["_id"] = max_pid
        p["rownumber"] = max_row
        products.append(p)
        existing.add(name)
        existing_norm.add(name.replace("ё", "е").lower())
        for nid, val in item["nutrients"].items():
            if float(val) == 0:
                continue
            info.append(
                {
                    "product": max_pid,
                    "nutrient": int(nid),
                    "value": float(val),
                    "rownumber": 0,
                    "_id": 0,
                }
            )
        added += 1
        print("+", max_pid, name, p["group"], p["fastdegree"])

    for i, row in enumerate(info, start=1):
        row["_id"] = i
        row["rownumber"] = i

    prod_out = (
        "[\n"
        + ",\n".join(json.dumps(p, ensure_ascii=False, separators=(",", ":")) for p in products)
        + "]"
    )
    new_text = text[:prod_arr] + prod_out + text[prod_end + 1 : info_arr] + fmt_info(info) + text[info_end + 1 :]
    DS.write_text(new_text, encoding="utf-8")
    print(f"added={added} products_total={len(products)} info_rows={len(info)}")


if __name__ == "__main__":
    main()
