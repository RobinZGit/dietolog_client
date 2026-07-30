# -*- coding: utf-8 -*-
"""Deep audit: unit mismatches + extreme outliers + example vs USDA ballpark."""
from __future__ import annotations

import json
import re
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "simple" / "dietolog.html").read_text(encoding="utf-8")
m = re.search(r"JSON\.parse\(\s*(\[[\s\S]*?\])\.join\(\"\"\)\s*\)", html[html.find("const SEED") :])
seed = json.loads("".join(json.loads(m.group(1))))
nutrients = {n["id"]: n for n in seed["nutrients"]}
products = {p["id"]: p for p in seed["products"]}
info = {int(k): v for k, v in seed["info"].items()}

lines = []

# --- Extreme products per nutrient ---
lines.append("=== TOP OUTLIERS (value / daily_min) ===")
for n in seed["nutrients"]:
    daily = n.get("min") or 0
    if not daily:
        continue
    ranked = []
    for pid, items in info.items():
        for nid, val in items:
            if nid == n["id"] and val > 0:
                ranked.append((val / daily, val, pid))
    ranked.sort(reverse=True)
    if not ranked:
        continue
    top = ranked[:5]
    if top[0][0] < 3:
        continue
    lines.append(f"\n{n['name']} [{n['units']}] min={daily}")
    for days, val, pid in top:
        p = products.get(pid, {})
        lines.append(
            f"  {days:.1f}x daily/100g  val={val}  id={pid} {p.get('name')} [{p.get('section')}/{p.get('group')}]"
        )

# --- Unit mismatch detector ---
# If units are мкг but median looks like мг (0.05..20) while daily min is thousands of мкг
lines.append("\n\n=== UNIT MISMATCH HEURISTIC ===")
for n in seed["nutrients"]:
    units = (n.get("units") or "").lower()
    daily = n.get("min") or 0
    vals = []
    for pid, items in info.items():
        # skip BAD section for heuristic
        p = products.get(pid, {})
        if p.get("section") == "bad":
            continue
        for nid, val in items:
            if nid == n["id"] and val > 0:
                vals.append(val)
    if len(vals) < 20:
        continue
    med = statistics.median(vals)
    if units in ("мкг", "ug", "µg") and daily >= 500 and 0.01 <= med <= 30:
        # likely values stored in mg
        lines.append(
            f"LIKELY mg-stored-as-mcg: {n['name']} units={n['units']} min={daily} "
            f"food_med={med:.4g}  if×1000 med={med*1000:.4g} (vs min)"
        )
    if units == "мг" and daily >= 100 and med > daily * 2:
        lines.append(
            f"POSSIBLE mcg-stored-as-mg OR bad data: {n['name']} med={med} min={daily}"
        )

# --- USDA ballpark for example foods (manual reference constants) ---
# Egg whole raw USDA SR approx per 100g
USDA = {
    "egg": {
        "kcal": 143, "protein": 12.6, "fat": 9.5, "carb": 0.7,
        "Ca": 56, "P": 198, "Fe": 1.75, "Mg": 12, "K": 138, "Na": 142,
        "Zn": 1.29, "Se": 30.7, "I": 49, "A_rae": 160, "D": 2.0, "B12": 0.89,
        "choline": 250, "chol": 372,
    },
    # Buckwheat groats raw approx
    "buckwheat": {
        "kcal": 343, "protein": 13.3, "fat": 3.4, "carb": 71.5,
        "fiber": 10, "Mg": 231, "P": 347, "Fe": 2.2, "Zn": 2.4, "Mn_mg": 1.3,
    },
    # White rice raw
    "rice": {
        "kcal": 365, "protein": 7.1, "fat": 0.7, "carb": 80,
        "Mg": 25, "P": 115, "Fe": 0.8, "Zn": 1.1,
    },
}

# Our example values
def get_map(pid):
    return {nid: val for nid, val in info.get(pid, [])}

name_by_id = {n["id"]: n["name"] for n in seed["nutrients"]}
id_by_name = {n["name"]: n["id"] for n in seed["nutrients"]}

def val(pid, *names):
    m = get_map(pid)
    for name in names:
        nid = id_by_name.get(name)
        if nid in m:
            return m[nid]
    return None

lines.append("\n\n=== EXAMPLE vs USDA BALLPARK ===")
egg = val
lines.append("Egg 193 vs USDA whole egg:")
pairs = [
    ("Калорийность", "kcal", None),
    ("Белки", "protein", None),
    ("Жиры", "fat", None),
    ("Кальций (Ca)", "Ca", None),
    ("Фосфор (P)", "P", None),
    ("Железо (Fe)", "Fe", None),
    ("Магний (Mg)", "Mg", None),
    ("Калий (K)", "K", None),
    ("Цинк (Zn)", "Zn", None),
    ("Йод (I)", "I", None),
    ("Витамин D", "D", None),
    ("Витамин В12", "B12", None),
    ("Холестерин", "chol", None),
]
em = get_map(193)
for our_name, usda_key, _ in pairs:
    nid = id_by_name.get(our_name)
    ours = em.get(nid) if nid else None
    ref = USDA["egg"].get(usda_key)
    if ours is None or ref is None:
        lines.append(f"  {our_name}: ours={ours} usda={ref}")
        continue
    ratio = ours / ref if ref else 0
    flag = " OK" if 0.5 <= ratio <= 2.0 else " << CHECK"
    lines.append(f"  {our_name}: ours={ours} usda≈{ref} ratio={ratio:.2f}{flag}")

bm = get_map(1134)
lines.append("\nBuckwheat 1134 vs USDA groats (approx):")
for our_name, usda_key in [
    ("Калорийность", "kcal"), ("Белки", "protein"), ("Жиры", "fat"),
    ("Углеводы", "carb"), ("Пищевые волокна", "fiber"),
    ("Магний (Mg)", "Mg"), ("Фосфор (P)", "P"), ("Железо (Fe)", "Fe"), ("Цинк (Zn)", "Zn"),
]:
    nid = id_by_name.get(our_name)
    ours = bm.get(nid) if nid else None
    ref = USDA["buckwheat"].get(usda_key)
    if ours is None or ref is None:
        continue
    ratio = ours / ref if ref else 0
    flag = " OK" if 0.5 <= ratio <= 2.0 else " << CHECK"
    lines.append(f"  {our_name}: ours={ours} usda≈{ref} ratio={ratio:.2f}{flag}")
si_id = id_by_name.get("Кремний (Si)")
lines.append(f"  Кремний (Si): ours={bm.get(si_id)} mg (USDA FDC usually N/A; literature plant Si often lower)")

rm = get_map(1147)
lines.append("\nRice 1147 vs USDA white rice raw:")
for our_name, usda_key in [
    ("Калорийность", "kcal"), ("Белки", "protein"), ("Углеводы", "carb"),
    ("Магний (Mg)", "Mg"), ("Фосфор (P)", "P"), ("Железо (Fe)", "Fe"),
]:
    nid = id_by_name.get(our_name)
    ours = rm.get(nid) if nid else None
    ref = USDA["rice"].get(usda_key)
    if ours is None or ref is None:
        continue
    ratio = ours / ref if ref else 0
    flag = " OK" if 0.5 <= ratio <= 2.0 else " << CHECK"
    lines.append(f"  {our_name}: ours={ours} usda≈{ref} ratio={ratio:.2f}{flag}")
lines.append(f"  Кремний (Si): ours={rm.get(si_id)} mg")

# Mn/Cu/B5 sample for egg and buckwheat
lines.append("\n=== Mn / Cu / B5 (unit suspects) for egg & buckwheat ===")
for label, pid in [("egg", 193), ("buckwheat", 1134), ("rice", 1147)]:
    mm = get_map(pid)
    for name in ["Марганец (Mn)", "Медь (Cu)", "Витамин В5"]:
        nid = id_by_name.get(name)
        n = nutrients[nid]
        lines.append(
            f"  {label} {name}: val={mm.get(nid)} declared_units={n['units']} min={n['min']}"
        )

out = ROOT / "_nutrient_audit_deep.txt"
out.write_text("\n".join(lines), encoding="utf-8")
print("wrote", out)
