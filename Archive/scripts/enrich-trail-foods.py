#!/usr/bin/env python3
"""Add istrail flag (походный запас) and missing shelf-stable products.

istrail=1 — long shelf life / compact / suitable to carry on a hike or trip.
Then: python Archive/scripts/build-simple-dietolog.py
"""
from __future__ import annotations

import json
import pathlib
import re

ARCHIVE = pathlib.Path(__file__).resolve().parents[1]
DS = ARCHIVE / "src" / "app" / "model" / "static.datasource.ts"

# Nutrient ids
KCAL, CARB, FAT, PROT = 3, 2, 1, 0
SUGAR, FIBER, STARCH = 45, 46, 53
NA, CL, K, S, P, CA, MG = 22, 25, 18, 23, 24, 19, 21
FE, ZN, MN, CU, I, SE, SI = 17, 43, 32, 33, 29, 38, 20
B1, B2, B3, B6, B9, B12, B5 = 5, 6, 7, 8, 9, 10, 52
C, E, A, PP, D = 11, 13, 4, 15, 12


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


def product(
    pid: int,
    row: int,
    name: str,
    group: str,
    fastdegree: str = "сухоядение",
    istrail: int = 1,
) -> dict:
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
        "istrail": istrail,
    }


# Non-trail dairy (in catalog, not for hiking — need cold).
NEW_NON_TRAIL: list[dict] = [
    {
        "product": product(
            0, 0, "Масло топлёное (гхи)", "Жиры и масла", "скоромное", istrail=0
        ),
        "nutrients": {
            KCAL: 892, PROT: 0.2, FAT: 99.0, CARB: 0.0,
            CA: 6, P: 20, NA: 5, A: 600, E: 2.5, D: 0.5,
        },
    },
    {
        "product": product(
            0, 0, "Сыр сливочный Cream Cheese", "Молочные продукты", "скоромное", istrail=0
        ),
        "nutrients": {
            KCAL: 342, PROT: 5.9, FAT: 34.0, CARB: 4.1, SUGAR: 3.2,
            NA: 321, K: 138, CA: 98, P: 106, MG: 9, A: 366, B2: 0.2, B12: 0.4, E: 0.9,
        },
    },
]


# Missing trail foods (per 100 g dry / as sold).
NEW_FOODS: list[dict] = [
    {
        "product": product(0, 0, "Чипсы картофельные", "Сахар и сладости", "до масла"),
        "nutrients": {
            KCAL: 536, PROT: 6.5, FAT: 35.0, CARB: 53.0, FIBER: 4.4, SUGAR: 0.5, STARCH: 45.0,
            NA: 525, CL: 800, K: 1175, P: 150, CA: 20, MG: 45, FE: 1.3, ZN: 0.8,
            B1: 0.15, B2: 0.1, PP: 3.5, B6: 0.5, C: 15.0, E: 6.0,
        },
    },
    {
        "product": product(0, 0, "Говядина сушёная", "Мясо", "скоромное"),
        "nutrients": {
            KCAL: 410, PROT: 33.0, FAT: 25.0, CARB: 10.0, SUGAR: 8.0, NA: 1780, CL: 2700,
            K: 600, P: 280, CA: 30, MG: 45, FE: 4.5, ZN: 6.0, SE: 25.0,
            B1: 0.1, B2: 0.25, PP: 5.0, B6: 0.3, B12: 2.0,
        },
    },
    {
        "product": product(0, 0, "Свинина сушёная", "Мясо", "скоромное"),
        "nutrients": {
            KCAL: 450, PROT: 30.0, FAT: 32.0, CARB: 8.0, SUGAR: 6.0, NA: 1600, CL: 2400,
            K: 500, P: 250, CA: 20, MG: 35, FE: 2.5, ZN: 4.0, SE: 20.0,
            B1: 0.4, B2: 0.2, PP: 4.0, B6: 0.25,
        },
    },
    {
        "product": product(0, 0, "Курица сушёная", "Птица", "скоромное"),
        "nutrients": {
            KCAL: 320, PROT: 45.0, FAT: 8.0, CARB: 12.0, SUGAR: 5.0, NA: 1400, CL: 2100,
            K: 550, P: 350, CA: 25, MG: 50, FE: 2.0, ZN: 3.5, SE: 30.0,
            B1: 0.1, B2: 0.2, PP: 12.0, B6: 0.5,
        },
    },
    {
        "product": product(0, 0, "Треска сушёная", "Рыба и морепродукты", "до рыбы"),
        "nutrients": {
            KCAL: 290, PROT: 62.0, FAT: 2.4, CARB: 0.0, NA: 7000, CL: 10500,
            K: 900, P: 700, CA: 150, MG: 120, FE: 2.5, ZN: 2.0, I: 150.0, SE: 80.0,
            B1: 0.1, B2: 0.15, PP: 8.0, B6: 0.4, B12: 3.0,
        },
    },
    {
        "product": product(0, 0, "Рыба сушёная (минтай)", "Рыба и морепродукты", "до рыбы"),
        "nutrients": {
            KCAL: 270, PROT: 58.0, FAT: 2.0, CARB: 0.0, NA: 4500, CL: 6800,
            K: 800, P: 650, CA: 120, MG: 100, FE: 1.8, ZN: 1.5, I: 100.0, SE: 60.0,
            B1: 0.08, B2: 0.12, PP: 6.0, B6: 0.35,
        },
    },
    {
        "product": product(0, 0, "Суп овощной сублимированный", "Овощи", "сухоядение"),
        "nutrients": {
            KCAL: 350, PROT: 12.0, FAT: 5.0, CARB: 65.0, FIBER: 8.0, SUGAR: 12.0, STARCH: 40.0,
            NA: 2800, CL: 4200, K: 900, P: 200, CA: 120, MG: 80, FE: 3.0, ZN: 1.5,
            B1: 0.2, B2: 0.15, PP: 3.0, B6: 0.3, C: 20.0, A: 400, E: 2.0,
        },
    },
    {
        "product": product(0, 0, "Каша гречневая сублимированная", "Зерновые и хлеб", "сухоядение"),
        "nutrients": {
            KCAL: 380, PROT: 12.0, FAT: 6.0, CARB: 70.0, FIBER: 6.0, SUGAR: 2.0, STARCH: 60.0,
            NA: 400, CL: 600, K: 400, P: 300, CA: 40, MG: 150, FE: 4.0, ZN: 2.5,
            B1: 0.3, B2: 0.15, PP: 4.0, B6: 0.3, E: 1.5,
        },
    },
    {
        "product": product(0, 0, "Мясо сублимированное (говядина)", "Мясо", "скоромное"),
        "nutrients": {
            KCAL: 480, PROT: 60.0, FAT: 25.0, CARB: 2.0, NA: 900, CL: 1400,
            K: 700, P: 450, CA: 30, MG: 60, FE: 6.0, ZN: 8.0, SE: 30.0,
            B1: 0.15, B2: 0.3, PP: 8.0, B6: 0.4,
        },
    },
    {
        "product": product(0, 0, "Яйцо сублимированное", "Яйца", "скоромное"),
        "nutrients": {
            KCAL: 590, PROT: 48.0, FAT: 42.0, CARB: 3.0, NA: 500, CL: 750,
            K: 500, P: 700, CA: 200, MG: 40, FE: 7.0, ZN: 5.0, SE: 100.0,
            B1: 0.2, B2: 1.2, PP: 0.5, B6: 0.3, B9: 150, A: 500, D: 5.0, E: 5.0,
        },
    },
]

def norm(s: str) -> str:
    return (s or "").lower().replace("ё", "е")


# Name patterns → trail food (shelf-stable / packable).
# Exclude fresh/cooked false positives (esp. in «Специи» mis-groupings).
EXCLUDE_RE = re.compile(
    r"варен|жарен|запеч|свеж|мороженое|йогурт|пломбир|сырое|грудинк"
)

NAME_RES: list[re.Pattern[str]] = [
    # dried vegetables (word order: «морковь сушёная» or «сушёная морковь»)
    re.compile(
        r"(морков|перец|лук репчат|свекл|капуст|кабач|баклаж|тыкв|"
        r"сельдер|шпинат|броккол|картоф|петруш|укроп).{0,40}(сушен|высушен)|"
        r"(сушен|высушен).{0,40}(морков|перец|лук|свекл|капуст|кабач|баклаж|тыкв|"
        r"сельдер|шпинат|броккол|картоф|петруш|укроп)|"
        r"вялен.{0,12}томат|томат.{0,12}вялен|морская капуста сушен|"
        r"базилик, сушеный"
    ),
    # cookies / crackers / wafers
    re.compile(r"печенье|галет|крекер|вафл"),
    # butter / oils / margarine (топлёное/гхи исключаются отдельно — не для похода)
    re.compile(r"\bмасло\b|маргарин"),
    # lard
    re.compile(r"\bсало\b|\bшпик\b"),
    # strong alcohol
    re.compile(r"водка|коньяк|ликер|виски|ром\b|джин\b|бренди|абсент|самогон|"
               r"вино крепкое|вино ликерное|текила(?! санрайз)"),
    # chocolate bars / paste (not ice cream / yogurt)
    re.compile(r"^шоколад\b|шоколадная паста"),
    # sweets
    re.compile(r"халва|карамель|ирис|мармелад|пастила|зефир|козинак|конфет|"
               r"^сахар\b|сахар-песок|\bмед\b|\bмёд\b"),
    # crisps
    re.compile(r"чипс"),
    # dried / cured meat & fish, sublimates
    re.compile(
        r"(мяс|говяд|свинин|куриц|рыб|треск|минтай|лещ).{0,20}сушен|"
        r"сушен.{0,20}(мяс|говяд|свинин|куриц|рыб|треск|минтай)|"
        r"(мяс|говяд|свинин|лещ|рыб).{0,20}вялен|вялен.{0,20}(мяс|говяд|свинин|лещ|рыб)|"
        r"балык|сублим|джерки|бастурма"
    ),
    # dried mushrooms
    re.compile(r"гриб.{0,20}сушен|сушен.{0,20}гриб"),
    # dried fruit
    re.compile(r"(яблок|груш|персик|слив|инжир|клюкв|абрикос).{0,20}сушен|"
               r"сушен.{0,20}(яблок|груш|персик|слив|инжир|клюкв|абрикос)|"
               r"курага|изюм|чернослив|финик"),
    # salt / pepper / spice-like dry seasonings
    re.compile(
        r"^соль |соль морская|соль поварен|"
        r"перец черн|перец красн|паприка|кориц|гвоздик|куркум|кардамон|"
        r"лавров|орегано|тимьян|майоран|розмарин|шалфей|мята сушен|"
        r"кориандр, лист|горчиц|хрен|васаби|карри|фенхель|тмин|анис|"
        r"муксатн|соевый соус"
    ),
    # dry grains / cereals (not bread/baked)
    re.compile(r"крупа|гречих|рис\b|овес|овёс|пшено|перлов|ячмен|киноа|"
               r"отруби|мука |манн"),
    # nuts / seeds (peeled, fried, dried — packable); «семена» with/without trailing text
    re.compile(
        r"орех|миндаль|кешью|фундук|арахис|семена|кунжут|мак,|"
        r"урбеч|желудь|каштан|очищен"
    ),
    # dry drinks / condensed
    re.compile(r"^чай |кофе |какао|молоко сухое|сливки сухие|"
               r"сгущен|сгущён"),
]

GROUP_ALWAYS = {
    "БАД",  # supplements are packable
}

# Whole groups that are trail food (except fresh/cooked exclusions below).
GROUP_TRAIL = {
    "Орехи и семена",  # peanuts fried/peeled, walnuts, pumpkin seeds, …
}

# Dry seasonings in «Специи» (skip cooked veg misfiled there).
GROUP_NAME_EXTRA = {
    "Специи и приправы": re.compile(
        r"сушен|молот|порошок|^соль |соль морская|соль поварен|"
        r"перец черн|перец красн|паприка|кориц|гвоздик|куркум|"
        r"кардамон|лавров|орегано|тимьян|майоран|розмарин|шалфей|мята|"
        r"кориандр|горчиц|хрен|васаби|карри|уксус|кетчуп|соевый|хвощ"
    ),
}

# Nuts / dried fruit: never treat «жареный / без соли» as a skip.
NUT_OR_SEED_RE = re.compile(
    r"арахис|орех|миндаль|кешью|фундук|семена|кунжут|урбеч|каштан|желудь|мак,"
)
DRIED_FRUIT_RE = re.compile(
    r"курага|изюм|чернослив|финик|"
    r"(яблок|груш|персик|слив|инжир|клюкв|абрикос).{0,20}сушен|"
    r"сушен.{0,20}(яблок|груш|персик|слив|инжир|клюкв|абрикос)"
)


def is_trail_product(p: dict) -> bool:
    name = norm(p.get("name", ""))
    group = p.get("group") or ""
    fd = str(p.get("fastdegree") or "")
    if fd.startswith("БАД") or group == "БАД":
        return True
    if group in GROUP_ALWAYS:
        return True

    # Dishes that merely contain nuts/raisins — not packable trail food.
    if re.search(r"бублик|творож|мороженое|йогурт|пломбир|запекан|оладь", name):
        return False

    # Soft / melted dairy fats — in the catalog, but not for hiking (need cold).
    if re.search(r"масло топлен|топленое масло|топлёное масло|\bгхи\b|"
                 r"сыр сливочн|cream cheese|филадельф|маскарпоне", name):
        return False

    # Fresh coconut pulp etc. — not trail; oils in this group stay via «масло» rule.
    if group in GROUP_TRAIL:
        if re.search(r"свеж", name) and "сушен" not in name:
            return False
        return True

    # Dried fruits (all shelf-stable).
    if DRIED_FRUIT_RE.search(name):
        return True

    if EXCLUDE_RE.search(name) and "сушен" not in name and "сублим" not in name:
        # cooked dishes / dairy desserts — not trail
        if re.search(r"варен|мороженое|йогурт|пломбир|запекан|оладь", name):
            if not NUT_OR_SEED_RE.search(name):
                return False
    for rx in NAME_RES:
        if rx.search(name):
            # cooked veg «вареный…» — skip; do NOT skip fried nuts «без соли»
            if (
                re.search(r"варен|свеж", name)
                and "сушен" not in name
                and not NUT_OR_SEED_RE.search(name)
            ):
                continue
            return True
    extra = GROUP_NAME_EXTRA.get(group)
    if extra and extra.search(name) and not re.search(r"варен|свеж", name):
        return True
    return False


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
    existing_norm = {norm(n) for n in existing}
    max_pid = max(int(p["_id"]) for p in products)
    max_row = max(int(p.get("rownumber") or 0) for p in products)

    added = 0
    for item in NEW_FOODS + NEW_NON_TRAIL:
        name = item["product"]["name"]
        if name in existing or norm(name) in existing_norm:
            print("skip existing", name)
            continue
        max_pid += 1
        max_row += 1
        p = dict(item["product"])
        p["_id"] = max_pid
        p["rownumber"] = max_row
        products.append(p)
        existing.add(name)
        existing_norm.add(norm(name))
        for nid, val in item["nutrients"].items():
            if float(val) == 0:
                continue
            info.append(
                {
                    "product": max_pid,
                    "nutrient": int(nid),
                    "value": str(float(val) if not float(val).is_integer() else int(val)),
                    "perc1on100gr": "0",
                    "rownumber": 0,
                    "_id": 0,
                }
            )
        added += 1
        print("+", max_pid, name, "istrail", p.get("istrail"))

    for p in products:
        p["istrail"] = 1 if is_trail_product(p) else 0
    marked = sum(1 for p in products if p["istrail"] == 1)

    for i, row in enumerate(info, start=1):
        row["_id"] = i
        row["rownumber"] = i
        if "perc1on100gr" not in row:
            row["perc1on100gr"] = "0"
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
    print(f"added={added} istrail={marked}/{len(products)} products_total={len(products)}")


if __name__ == "__main__":
    main()
