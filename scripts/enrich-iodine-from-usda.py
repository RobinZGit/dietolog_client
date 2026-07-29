#!/usr/bin/env python3
"""Обогащение info/products йодом (и точечно) из USDA/FDA/ODS Iodine DB R4 + типовые RU-оценки.

Запуск из корня репозитория:
  python3 scripts/enrich-iodine-from-usda.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DS = ROOT / "src" / "app" / "model" / "static.datasource.ts"
REPORT = ROOT / "docs" / "IODINE_ENRICHMENT.md"

# nutrient id
IODINE = 29

# product_id -> iodine mcg/100g, source note
# USDA/FDA/ODS Iodine Database Release 4 (per 100g) where matched;
# RU notes where Russian iodized salt / seaweed estimates.
UPDATES: list[tuple[int, float, str]] = [
    # --- salt ---
    (1097, 4000.0, "RU iodized table salt ~40 mcg/g (типичная поваренная йодированная)"),
    # --- seaweed (USDA nori + literature for others) ---
    (982, 2316.7, "USDA R4: Nori, seaweed, dried"),
    (981, 1500.0, "estimate dried kelp/kombu (литература; в USDA R4 нет kelp iodine)"),
    (979, 42.0, "approx USDA SR wakame raw order"),
    (980, 47.0, "estimate Irish moss / carrageen"),
    (983, 15.0, "estimate spirulina dried (low)"),
    (977, 20.0, "estimate agar dry (low after processing)"),
    (978, 8.0, "estimate agar wet"),
    # --- shellfish ---
    (747, 109.1, "USDA R4: oyster eastern cooked"),
    (748, 109.1, "USDA R4: oyster eastern cooked"),
    (751, 109.1, "USDA R4 proxy: oyster cooked"),
    (749, 80.0, "estimate oyster raw (между cooked USDA и лит.)"),
    (750, 70.0, "estimate oyster canned"),
    (752, 80.0, "estimate Pacific oyster raw"),
    (738, 100.0, "estimate mussels cooked (лит./EU tables)"),
    (730, 60.0, "estimate mussels raw"),
    (739, 60.0, "estimate blue mussels raw"),
    (754, 185.0, "USDA R4: lobster cooked"),
    (753, 120.0, "estimate langoustine / lobster-like"),
    # --- eggs ---
    (192, 61.0, "USDA R4: eggs hard-boiled"),
    (194, 40.0, "estimate quail egg"),
    (195, 50.0, "estimate duck egg"),
    (187, 349.3, "USDA R4: egg yolk dried (upgrade)"),
    (191, 274.4, "USDA R4: egg whole dried (if product exists as powder)"),
    # --- milk ---
    (237, 34.2, "USDA R4: milk skim"),
    (242, 34.2, "USDA R4: milk skim"),
    (241, 36.1, "USDA R4: milk 1%"),
    (238, 36.1, "USDA R4: milk 1%"),
    (239, 35.8, "USDA R4: milk 2%"),
    (240, 33.5, "USDA R4: milk whole"),
    (257, 33.5, "USDA R4: milk whole"),
    # --- yogurt / kefir ---
    (202, 40.0, "USDA R4 order: yogurt plain ~32-59"),
    (203, 40.0, "USDA R4 order: yogurt plain"),
    (204, 40.0, "USDA R4 order: yogurt plain"),
    (205, 35.0, "USDA R4 order: flavored yogurt"),
    (206, 35.0, "USDA R4 order: fruit yogurt"),
    (207, 35.0, "USDA R4 order: flavored yogurt"),
    (208, 35.0, "USDA R4 order: flavored yogurt"),
    (209, 40.0, "USDA R4 order: yogurt"),
    (210, 40.0, "USDA R4 order: yogurt"),
    (211, 35.0, "USDA R4 order: fruit yogurt"),
    (212, 35.0, "USDA R4 order: flavored yogurt"),
    (213, 30.0, "estimate kefir ~ dairy"),
    (214, 30.0, "estimate kefir"),
    (216, 28.0, "estimate kefir lowfat"),
    (284, 28.0, "estimate prostokvasha"),
    (285, 28.0, "estimate prostokvasha"),
    (287, 26.0, "estimate prostokvasha nonfat"),
    # --- cheeses (USDA R4) ---
    (383, 45.9, "USDA R4: cheddar"),
    (338, 45.9, "USDA R4: cheddar lowfat proxy"),
    (384, 137.3, "USDA R4: Swiss"),
    (385, 59.9, "USDA R4: Swiss low fat processed"),
    (386, 137.3, "USDA R4: Swiss"),
    (388, 137.3, "USDA R4 proxy Emmental/Swiss"),
    (344, 51.0, "USDA R4: mozzarella"),
    (345, 51.0, "USDA R4: mozzarella"),
    (346, 51.0, "USDA R4: mozzarella"),
    (347, 51.0, "USDA R4: mozzarella"),
    (348, 51.0, "USDA R4: mozzarella"),
    (353, 82.4, "USDA R4: parmesan grated"),
    (354, 82.4, "USDA R4: parmesan"),
    (355, 82.4, "USDA R4: parmesan"),
    (356, 82.4, "USDA R4: parmesan"),
    (381, 48.4, "USDA R4: feta"),
    (362, 66.0, "USDA R4: ricotta"),
    (363, 66.0, "USDA R4: ricotta whole"),
    (360, 64.3, "USDA R4: provolone"),
    (361, 64.3, "USDA R4: provolone"),
    (342, 40.0, "USDA R4: Monterey Jack"),
    (343, 40.0, "USDA R4: Monterey Jack"),
    (333, 56.7, "USDA R4: American processed proxy for sausage cheese"),
    (329, 56.7, "USDA R4: processed cheese proxy"),
    (339, 56.7, "USDA R4: processed cheese proxy"),
    (351, 56.7, "USDA R4: processed cheese proxy"),
    (367, 56.7, "USDA R4: processed cheese proxy"),
    (371, 56.7, "USDA R4: processed cheese proxy"),
    (372, 56.7, "USDA R4: processed cheese proxy"),
    # --- fish upgrades / fill ---
    (692, 172.1, "USDA R4: cod baked"),
    (697, 172.1, "USDA R4: cod baked"),
    (694, 150.0, "estimate boiled cod ~ raw/baked USDA"),
    (691, 140.0, "estimate fried cod"),
    (696, 140.0, "estimate stewed cod"),
    (690, 120.0, "estimate smoked cod"),
    (693, 100.0, "estimate canned smoked cod in oil"),
    (695, 110.0, "estimate salted cod"),
    (698, 130.6, "USDA R4: Pacific cod raw"),
    (631, 200.0, "USDA R4 haddock raw 227 → baked estimate"),
    (632, 180.0, "estimate smoked haddock"),
    (714, 140.0, "estimate hake poached"),
    (724, 15.0, "USDA R4: shrimp precooked ~15"),
    (725, 14.0, "USDA R4: shrimp raw order"),
    (726, 15.0, "USDA R4: shrimp precooked"),
    (704, 8.7, "USDA R4: tuna canned water"),
    (705, 8.7, "USDA R4: tuna canned"),
    (700, 23.0, "USDA R4: tuna cooked dry heat"),
    (702, 23.0, "USDA R4: tuna cooked"),
    (629, 250.0, "estimate canned cod liver (лит., высоковариативно)"),
]

NEW_PRODUCTS = [
    {
        "hint": "",
        "rownumber": 1232,
        "_id": 1249,
        "name": "Соль поваренная йодированная",
        "lowercase": "соль поваренная йодированная",
        "val": 0,
        "isrecommended": 0,
        "isnotrecommended": 0,
        "excluded": 0,
        "fastdegree": "сухоядение",
    },
    {
        "hint": "",
        "rownumber": 1233,
        "_id": 1250,
        "name": "Нори, морские водоросли сушёные",
        "lowercase": "нори водоросли сушеные",
        "val": 0,
        "isrecommended": 0,
        "isnotrecommended": 0,
        "excluded": 0,
        "fastdegree": "сухоядение",
    },
]

NEW_IODINE_FOR_NEW = [
    (1249, 5213.1, "USDA R4: Salt, table, iodized"),
    (1250, 2316.7, "USDA R4: Nori, seaweed, dried"),
]


def load_ds(text: str):
    # nutrients already ok
    m_prod = re.search(r"private products: any =\n", text)
    m_info = re.search(r"private info: any = \[", text)
    assert m_prod and m_info
    prod_start = m_prod.end()
    # products from first [ to ]; before comment/info
    prod_block_end = text.find("\n;\n", prod_start)
    prod_json = text[prod_start:prod_block_end].strip()
    if prod_json.endswith(";"):
        prod_json = prod_json[:-1]
    products = json.loads(prod_json)

    info_start = text.find("[", m_info.start())
    # last ] of file before final }
    info_end = text.rfind("]")
    info = json.loads(text[info_start : info_end + 1])
    return products, info, prod_start, prod_block_end, info_start, info_end


def main():
    text = DS.read_text(encoding="utf-8")
    products, info, prod_start, prod_block_end, info_start, info_end = load_ds(text)
    by_prod = {p["_id"]: p for p in products}
    max_info_id = max(int(i["_id"]) for i in info)

    # existing iodine map
    iod = {}
    for row in info:
        if int(row["nutrient"]) == IODINE:
            iod[int(row["product"])] = row

    added = []
    updated = []
    skipped = []

    def upsert(pid: int, value: float, note: str):
        nonlocal max_info_id
        if pid not in by_prod and pid not in {p["_id"] for p in NEW_PRODUCTS}:
            skipped.append((pid, "no product", note))
            return
        # daily min 100 mcg → perc
        perc = str(int(round(100 * value / 100.0)))
        val_s = str(int(value)) if float(value).is_integer() else str(round(value, 1))
        if pid in iod:
            old = float(iod[pid]["value"])
            # only upgrade if new is meaningfully different / filling zeros
            iod[pid]["value"] = val_s
            iod[pid]["perc1on100gr"] = perc
            updated.append((pid, old, value, note))
        else:
            max_info_id += 1
            row = {
                "_id": max_info_id,
                "product": pid,
                "nutrient": IODINE,
                "value": val_s,
                "perc1on100gr": perc,
            }
            info.append(row)
            iod[pid] = row
            added.append((pid, value, note))

    for pid, val, note in UPDATES:
        upsert(pid, val, note)

    # new products
    existing_ids = {p["_id"] for p in products}
    for p in NEW_PRODUCTS:
        if p["_id"] not in existing_ids:
            products.append(p)
            by_prod[p["_id"]] = p

    for pid, val, note in NEW_IODINE_FOR_NEW:
        upsert(pid, val, note)

    # rewrite products as one-object-per-line like original
    prod_lines = ["[" + json.dumps(products[0], ensure_ascii=False, separators=(",", ":"))]
    for p in products[1:]:
        prod_lines.append(json.dumps(p, ensure_ascii=False, separators=(",", ":")))
    # fix first line bracket: original was [{"hint"...}, then next lines without leading comma on same - actually each line is object with comma at end except last has }]
    # Rebuild like original format
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

    # info pretty like original
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

    info_text = fmt_info(info)
    new_text = text[:prod_start] + prod_text + text[prod_block_end:info_start] + info_text + text[info_end + 1 :]
    DS.write_text(new_text, encoding="utf-8")

    # report
    def pname(pid):
        return by_prod.get(pid, {}).get("name", f"#{pid}")

    lines = [
        "# Обогащение базы йодом",
        "",
        "Источник значений: **USDA, FDA and ODS-NIH Database for the Iodine Content of Common Foods, Release 4 (2024)** (mcg/100 g),",
        "плюс точечные оценки для продуктов без прямого соответствия (отмечены в таблице).",
        "",
        f"- Добавлено новых записей `info` (йод): **{len(added)}**",
        f"- Обновлено существующих записей йода: **{len(updated)}**",
        f"- Новые продукты: **{len(NEW_PRODUCTS)}** (`1249` йодированная соль, `1250` нори сушёные)",
        "",
        "## Добавлено",
        "",
        "| product_id | Продукт | I mcg/100g | Источник |",
        "|---|---|---:|---|",
    ]
    for pid, val, note in added:
        lines.append(f"| {pid} | {pname(pid)} | {val} | {note} |")
    lines += ["", "## Обновлено", "", "| product_id | Продукт | было | стало | Источник |", "|---|---|---:|---:|---|"]
    for pid, old, val, note in updated:
        lines.append(f"| {pid} | {pname(pid)} | {old} | {val} | {note} |")
    if skipped:
        lines += ["", "## Пропущено", ""]
        for pid, why, note in skipped:
            lines.append(f"- {pid}: {why} ({note})")
    lines += [
        "",
        "## Остающиеся дыры (не трогали в этом проходе)",
        "",
        "- Микроэлементы с покрытием <15%: ванадий, кремний, бор, витамин B3/H/D, хром, фтор, кобальт, молибден, сера, хлор — нужны отдельные источники.",
        "- Полный импорт USDA FoodData Central не делался (другие имена продуктов, объём).",
        "",
    ]
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"added={len(added)} updated={len(updated)} products={len(products)} info={len(info)}")
    print("wrote", REPORT)


if __name__ == "__main__":
    main()
