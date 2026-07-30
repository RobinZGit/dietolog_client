#!/usr/bin/env python3
"""Add tasty plant foods missing from the catalog: tofu, soy meat, hummus, etc.

Updates Archive/src/app/model/static.datasource.ts
Then rebuild with: python Archive/scripts/build-simple-dietolog.py
"""
from __future__ import annotations

import json
import pathlib
import re

ARCHIVE = pathlib.Path(__file__).resolve().parents[1]
DS = ARCHIVE / "src" / "app" / "model" / "static.datasource.ts"

# Nutrient ids (same as seed)
KCAL, CARB, FAT, PROT = 3, 2, 1, 0
SUGAR, FIBER = 45, 46
NA, CL, K, S, P, CA, MG = 22, 25, 18, 23, 24, 19, 21
FE, ZN, MN, CU, I, SE = 17, 43, 32, 33, 29, 38
B1, B2, B3, B6, B9, C, E, A, D = 5, 6, 7, 8, 9, 11, 13, 4, 12


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


def product(pid: int, row: int, name: str, group: str, fastdegree: str = "сухоядение") -> dict:
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


# Values per 100 g — USDA FDC / Russian food tables / typical labels (rounded).
NEW_FOODS: list[dict] = [
    {
        "product": product(0, 0, "Тофу твердый", "Бобовые"),
        "nutrients": {
            KCAL: 144, PROT: 17.3, FAT: 8.7, CARB: 2.8, FIBER: 2.3, SUGAR: 0.6,
            CA: 345, P: 190, MG: 58, K: 146, NA: 14, FE: 2.7, ZN: 1.6, MN: 1.2,
            CU: 0.4, SE: 17.4, B1: 0.16, B2: 0.1, B3: 0.4, B6: 0.09, B9: 29, E: 0.1,
        },
    },
    {
        "product": product(0, 0, "Тофу мягкий (шелковый)", "Бобовые"),
        "nutrients": {
            KCAL: 61, PROT: 7.2, FAT: 3.7, CARB: 1.2, FIBER: 0.2, SUGAR: 0.7,
            CA: 111, P: 92, MG: 27, K: 120, NA: 8, FE: 1.1, ZN: 0.6, MN: 0.4,
            CU: 0.2, SE: 8.9, B1: 0.05, B2: 0.04, B3: 0.2, B6: 0.05, B9: 44,
        },
    },
    {
        "product": product(0, 0, "Соевое мясо (текстурат), сухое", "Бобовые"),
        "nutrients": {
            KCAL: 337, PROT: 52.0, FAT: 1.2, CARB: 30.0, FIBER: 16.0, SUGAR: 5.0,
            CA: 240, P: 650, MG: 290, K: 2000, NA: 20, FE: 9.0, ZN: 5.0, MN: 2.5,
            CU: 1.2, SE: 20, B1: 0.7, B2: 0.3, B3: 2.5, B6: 0.5, B9: 300, E: 0.5,
        },
    },
    {
        "product": product(0, 0, "Соевое мясо отварное", "Бобовые"),
        "nutrients": {
            KCAL: 120, PROT: 18.0, FAT: 0.5, CARB: 10.0, FIBER: 5.5, SUGAR: 1.5,
            CA: 85, P: 220, MG: 90, K: 500, NA: 15, FE: 3.0, ZN: 1.6, MN: 0.8,
            CU: 0.4, B1: 0.15, B2: 0.08, B3: 0.6, B6: 0.12, B9: 60,
        },
    },
    {
        "product": product(0, 0, "Темпе", "Бобовые"),
        "nutrients": {
            KCAL: 193, PROT: 19.9, FAT: 10.8, CARB: 9.4, FIBER: 4.8, SUGAR: 0.9,
            CA: 96, P: 253, MG: 70, K: 401, NA: 9, FE: 2.7, ZN: 1.2, MN: 1.3,
            CU: 0.5, SE: 0.02, B1: 0.08, B2: 0.36, B3: 2.6, B6: 0.22, B9: 24, E: 0.3,
        },
    },
    {
        "product": product(0, 0, "Хумус", "Бобовые", "до масла"),
        "nutrients": {
            KCAL: 166, PROT: 7.9, FAT: 9.6, CARB: 14.3, FIBER: 6.0, SUGAR: 0.3,
            CA: 49, P: 146, MG: 71, K: 228, NA: 379, FE: 2.4, ZN: 1.1, MN: 0.8,
            CU: 0.4, SE: 2.6, B1: 0.15, B2: 0.06, B3: 0.7, B6: 0.2, B9: 83, E: 0.8, C: 3.0,
        },
    },
    {
        "product": product(0, 0, "Фалафель жареный", "Бобовые", "до масла"),
        "nutrients": {
            KCAL: 333, PROT: 13.3, FAT: 17.8, CARB: 31.8, FIBER: 5.4, SUGAR: 1.0,
            CA: 54, P: 192, MG: 82, K: 585, NA: 294, FE: 3.4, ZN: 1.5, MN: 0.7,
            CU: 0.3, B1: 0.15, B2: 0.1, B3: 1.0, B6: 0.13, B9: 93, E: 1.5, C: 1.0,
        },
    },
    {
        "product": product(0, 0, "Нут варёный", "Бобовые"),
        "nutrients": {
            KCAL: 164, PROT: 8.9, FAT: 2.6, CARB: 27.4, FIBER: 7.6, SUGAR: 4.8,
            CA: 49, P: 168, MG: 48, K: 291, NA: 7, FE: 2.9, ZN: 1.5, MN: 1.0,
            CU: 0.35, SE: 3.7, B1: 0.12, B2: 0.06, B3: 0.5, B6: 0.14, B9: 172, E: 0.35, C: 1.3,
        },
    },
    {
        "product": product(0, 0, "Чечевица варёная", "Бобовые"),
        "nutrients": {
            KCAL: 116, PROT: 9.0, FAT: 0.4, CARB: 20.1, FIBER: 7.9, SUGAR: 1.8,
            CA: 19, P: 180, MG: 36, K: 369, NA: 2, FE: 3.3, ZN: 1.3, MN: 0.5,
            CU: 0.25, SE: 2.8, B1: 0.17, B2: 0.07, B3: 1.1, B6: 0.18, B9: 181, E: 0.11, C: 1.5,
        },
    },
    {
        "product": product(0, 0, "Фасоль варёная", "Бобовые"),
        "nutrients": {
            KCAL: 127, PROT: 8.7, FAT: 0.5, CARB: 22.8, FIBER: 6.4, SUGAR: 0.3,
            CA: 35, P: 140, MG: 45, K: 355, NA: 1, FE: 2.1, ZN: 0.9, MN: 0.4,
            CU: 0.2, SE: 1.2, B1: 0.16, B2: 0.06, B3: 0.5, B6: 0.1, B9: 130, E: 0.2, C: 0.5,
        },
    },
    {
        "product": product(0, 0, "Фасоль запечённая в томате, консервы", "Бобовые", "до масла"),
        "nutrients": {
            KCAL: 94, PROT: 4.8, FAT: 0.4, CARB: 17.0, FIBER: 4.1, SUGAR: 6.0,
            CA: 45, P: 80, MG: 30, K: 280, NA: 380, FE: 1.5, ZN: 0.6, MN: 0.3,
            CU: 0.15, B1: 0.08, B2: 0.05, B3: 0.5, B6: 0.08, B9: 35, C: 2.0, A: 15,
        },
    },
    {
        "product": product(0, 0, "Морская капуста (ламинария), консервы", "Овощи"),
        "nutrients": {
            KCAL: 16, PROT: 0.9, FAT: 0.2, CARB: 3.0, FIBER: 0.6, SUGAR: 0.2,
            CA: 40, P: 40, MG: 40, K: 120, NA: 520, CL: 800, FE: 2.0, I: 200.0,
            ZN: 0.3, MN: 0.2, CU: 0.1, SE: 0.7, B1: 0.02, B2: 0.04, B3: 0.2, C: 1.0, A: 15,
        },
    },
    {
        "product": product(0, 0, "Морская капуста сушёная", "Овощи"),
        "nutrients": {
            KCAL: 43, PROT: 8.0, FAT: 0.5, CARB: 12.0, FIBER: 8.0, SUGAR: 0.5,
            CA: 200, P: 180, MG: 150, K: 1500, NA: 300, FE: 8.0, I: 2500.0,
            ZN: 1.2, MN: 1.0, CU: 0.4, SE: 2.0, B1: 0.1, B2: 0.2, B3: 1.0, C: 3.0, A: 40,
        },
    },
    {
        "product": product(0, 0, "Семена тыквы очищенные", "Орехи и семена", "до масла"),
        "nutrients": {
            KCAL: 559, PROT: 30.2, FAT: 49.0, CARB: 10.7, FIBER: 6.0, SUGAR: 1.4,
            CA: 46, P: 1233, MG: 592, K: 809, NA: 7, FE: 8.8, ZN: 7.8, MN: 4.5,
            CU: 1.3, SE: 9.4, B1: 0.27, B2: 0.15, B3: 5.0, B6: 0.14, B9: 58, E: 2.2,
        },
    },
    {
        "product": product(0, 0, "Семена подсолнечника очищенные", "Орехи и семена", "до масла"),
        "nutrients": {
            KCAL: 584, PROT: 20.7, FAT: 51.5, CARB: 20.0, FIBER: 8.6, SUGAR: 2.6,
            CA: 78, P: 660, MG: 325, K: 645, NA: 9, FE: 5.3, ZN: 5.0, MN: 2.0,
            CU: 1.8, SE: 53.0, B1: 1.5, B2: 0.36, B3: 8.3, B6: 1.3, B9: 227, E: 35.0,
        },
    },
    {
        "product": product(0, 0, "Урбеч из миндаля", "Орехи и семена", "до масла"),
        "nutrients": {
            KCAL: 614, PROT: 21.0, FAT: 54.0, CARB: 18.0, FIBER: 10.0, SUGAR: 4.0,
            CA: 250, P: 460, MG: 250, K: 700, NA: 5, FE: 4.0, ZN: 3.2, MN: 2.0,
            CU: 1.0, SE: 2.5, B1: 0.2, B2: 0.9, B3: 3.5, B6: 0.14, B9: 45, E: 25.0,
        },
    },
    {
        "product": product(0, 0, "Козинак подсолнечный", "Сахар и сладости", "до масла"),
        "nutrients": {
            KCAL: 530, PROT: 14.0, FAT: 30.0, CARB: 52.0, FIBER: 4.0, SUGAR: 40.0,
            CA: 60, P: 400, MG: 180, K: 350, NA: 40, FE: 3.5, ZN: 3.0, MN: 1.2,
            CU: 1.0, B1: 0.6, B2: 0.15, B3: 4.0, B6: 0.5, B9: 80, E: 15.0,
        },
    },
    {
        "product": product(0, 0, "Вафли ореховые", "Сахар и сладости", "до масла"),
        "nutrients": {
            KCAL: 510, PROT: 7.5, FAT: 28.0, CARB: 58.0, FIBER: 2.5, SUGAR: 32.0,
            CA: 50, P: 120, MG: 45, K: 180, NA: 180, FE: 1.5, ZN: 0.9, MN: 0.5,
            CU: 0.25, B1: 0.1, B2: 0.08, B3: 0.8, B6: 0.06, B9: 20, E: 3.0, A: 20,
        },
    },
    {
        "product": product(0, 0, "Соевый соус", "Специи и приправы"),
        "nutrients": {
            KCAL: 53, PROT: 8.1, FAT: 0.1, CARB: 4.9, FIBER: 0.8, SUGAR: 0.4,
            CA: 17, P: 130, MG: 40, K: 435, NA: 5493, CL: 8500, FE: 1.5, ZN: 0.4,
            MN: 0.5, CU: 0.05, B1: 0.03, B2: 0.15, B3: 2.2, B6: 0.2, B9: 14,
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
    max_pid = max(int(p["_id"]) for p in products)
    max_row = max(int(p.get("rownumber") or 0) for p in products)

    added = 0
    for item in NEW_FOODS:
        name = item["product"]["name"]
        if name in existing:
            print("skip existing", name)
            continue
        max_pid += 1
        max_row += 1
        p = dict(item["product"])
        p["_id"] = max_pid
        p["rownumber"] = max_row
        products.append(p)
        existing.add(name)
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
        print("+" , max_pid, name, p["group"], p["fastdegree"])

    # renumber info _id / rownumber lightly
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
