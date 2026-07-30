# -*- coding: utf-8 -*-
"""Fix nutrient unit mismatches and clear scale errors in static.datasource.ts.

Findings (vs USDA FDC / literature):
- Mn, Cu, B5: values are in mg, but units/min declared as mcg → rename units to mg, /1000 mins.
- Silicon (Si): grain values ~50–100× too high vs literature (rice ~1–2 mg/100g, ours 100–1240).
- Ячмень лущеный B2=28 mg → likely 0.28 (USDA ~0.285).
- Фейхоа Zn=40 mg → likely ~0.04–0.06 (USDA ~0.06).

BAD rows keep dose×100 convention (unchanged).
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "app" / "model" / "static.datasource.ts"


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


def patch_nutrient_block(text: str, nutrient_id: int, units: str, min_v: float, max_v: float, koeff: float) -> str:
    """Replace units/min/max/koeff inside the nutrient object with given _id."""
    # Find object containing "_id": <id> near name — use a window around _id
    pat = re.compile(
        rf'(\{{\s*"info":\s*"[^"]*",\s*"hint":\s*"[^"]*",\s*"_id":\s*{nutrient_id},[\s\S]*?"units":\s*")[^"]+("[\s\S]*?"min_dailyrate":\s*)[^,]+(,[\s\S]*?"max_dailyrate":\s*)[^,]+(,[\s\S]*?"koeff_to_miligr":\s*)[^,]+',
        re.M,
    )

    def repl(m: re.Match) -> str:
        return (
            f"{m.group(1)}{units}{m.group(2)}{min_v}{m.group(3)}{max_v}{m.group(4)}{koeff}"
        )

    new, n = pat.subn(repl, text, count=1)
    if n != 1:
        raise SystemExit(f"nutrient {_id if False else nutrient_id} block not patched (n={n})")
    return new


def main() -> int:
    text = SRC.read_text(encoding="utf-8")

    # 1) Unit label fixes: values already in mg
    # Mn id=32, B5 id=52, Cu id=33
    text = patch_nutrient_block(text, 32, "мг", 5, 10, 1)
    text = patch_nutrient_block(text, 52, "мг", 5, 10, 1)
    text = patch_nutrient_block(text, 33, "мг", 1.5, 3, 1)

    # 2) Parse products + info
    prod_eq = text.find("private products: any =\n")
    prod_arr = prod_eq + len("private products: any =\n")
    prod_json, prod_end = bracket_slice(text, prod_arr)
    products = json.loads(prod_json)
    bad_ids = set()
    for p in products:
        fd = str(p.get("fastdegree") or "")
        if fd.startswith("БАД") or p.get("group") == "БАД" or p.get("section") == "bad":
            bad_ids.add(int(p["_id"]))

    info_start = text.find("private info: any =")
    info_arr = text.find("[", info_start)
    info_json, info_end = bracket_slice(text, info_arr)
    info_rows = json.loads(info_json)

    SI = 20
    B2 = 6
    ZN = 34  # verify
    # find zinc id from nutrients section
    nutr_start = text.find("private nutrients")
    nutr_arr = text.find("[", nutr_start)
    # parse nutrient ids by regex
    name_to_id = {}
    for m in re.finditer(
        r'\{\s*"info":[\s\S]*?"_id":\s*(\d+),\s*"name":\s*"([^"]+)"',
        text[nutr_arr:prod_eq],
    ):
        name_to_id[m.group(2)] = int(m.group(1))
    ZN = name_to_id.get("Цинк (Zn)", 34)
    B2 = name_to_id.get("Витамин В2", 6)
    SI = name_to_id.get("Кремний (Si)", 20)
    IOD = name_to_id.get("Йод (I)", 36)

    print("ids", {"Si": SI, "B2": B2, "Zn": ZN, "I": IOD})

    # product name → id
    by_name = {p["name"]: int(p["_id"]) for p in products}
    barley_id = by_name.get("Ячмень, лущеный")
    feijoa_id = by_name.get("Фейхоа")
    egg_id = by_name.get("Яйцо куриное, целое")

    si_changed = 0
    point_fixes = 0
    for row in info_rows:
        pid = int(row["product"])
        nid = int(row["nutrient"])
        val = float(row["value"])
        if val == 0:
            continue

        # Silicon ÷100 for foods (not BAD)
        if nid == SI and pid not in bad_ids:
            new_v = round(val / 100.0, 4)
            if new_v != val:
                row["value"] = new_v
                si_changed += 1
            continue

        # Point fixes
        if barley_id and pid == barley_id and nid == B2 and val >= 10:
            row["value"] = round(val / 100.0, 4)
            point_fixes += 1
        elif feijoa_id and pid == feijoa_id and nid == ZN and val >= 1:
            # USDA feijoa Zn ≈ 0.06 mg/100g
            row["value"] = 0.06
            point_fixes += 1
        elif egg_id and pid == egg_id and nid == IOD and 0 < val < 30:
            # USDA/FDA/ODS iodine DB ≈ 49 mcg/100g whole egg
            row["value"] = 49.0
            point_fixes += 1

    new_info = json.dumps(info_rows, ensure_ascii=False, separators=(",", ":"))
    # pretty-ish: keep compact like original? Original is pretty-printed array.
    # Use same formatting as json.dumps with indent=1 to limit diff size — actually file uses multi-line objects.
    # Safest: dump with indent=1 matching style roughly
    new_info_pretty = json.dumps(info_rows, ensure_ascii=False, indent=1)
    # original starts at info_arr with '[' 
    text = text[:info_arr] + new_info_pretty + text[info_end + 1 :]

    SRC.write_text(text, encoding="utf-8", newline="\n")
    print("silicon rows scaled:", si_changed)
    print("point fixes:", point_fixes)
    print("updated", SRC)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
