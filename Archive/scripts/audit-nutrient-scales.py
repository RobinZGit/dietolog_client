# -*- coding: utf-8 -*-
"""Inspect example layout products and suspicious nutrient scales."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "simple" / "dietolog.html").read_text(encoding="utf-8")
m = re.search(r"JSON\.parse\(\s*(\[[\s\S]*?\])\.join\(\"\"\)\s*\)", html[html.find("const SEED") :])
seed = json.loads("".join(json.loads(m.group(1))))

nutrients = {n["id"]: n for n in seed["nutrients"]}
products = {p["id"]: p for p in seed["products"]}
info = {int(k): v for k, v in seed["info"].items()}

EXAMPLE_SLUGS = {
    "yajco_kurinoe_celoe": "яйцо куриное, целое",
    "grechiha_zerno": "гречиха, зерно",
    "moloko_suhoe_1": "молоко сухое, 1%",
    "krupa_risovaya": "крупа рисовая",
}

# Find products by name substring
found = []
for needle in EXAMPLE_SLUGS.values():
    for p in seed["products"]:
        if needle in p["name"].lower():
            found.append(p)
            break

lines = []
lines.append("=== EXAMPLE PRODUCTS ===")
for p in found:
    lines.append(f"id={p['id']} name={p['name']} group={p.get('group')}")
    items = info.get(p["id"], [])
    # sort by value desc
    rows = []
    for nid, val in items:
        n = nutrients.get(nid, {})
        daily = n.get("min") or 0
        pct100 = (val / daily * 100) if daily else 0
        rows.append((pct100, nid, n.get("name"), val, n.get("units"), daily))
    rows.sort(reverse=True)
    lines.append("  Top by % daily min per 100g:")
    for pct, nid, name, val, units, daily in rows[:12]:
        lines.append(
            f"    {name}: {val} {units} /100g  (min {daily} {units}) => {pct:.0f}% /100g"
        )
    # Silicon specifically
    for nid, val in items:
        if nutrients.get(nid, {}).get("name", "").startswith("Кремний"):
            n = nutrients[nid]
            lines.append(
                f"  SI: {val} {n['units']} /100g vs min {n['min']} => days/100g={val/n['min']:.2f}"
            )

lines.append("\n=== NUTRIENTS: value distributions (per 100g across products) ===")
# For each nutrient: max value, p99, median of non-zero, compare to daily min
import statistics

for n in sorted(seed["nutrients"], key=lambda x: x["name"]):
    vals = []
    for pid, items in info.items():
        for nid, val in items:
            if nid == n["id"] and val > 0:
                vals.append(val)
    if not vals:
        lines.append(f"{n['name']}: NO DATA")
        continue
    vals.sort()
    mx = vals[-1]
    med = statistics.median(vals)
    p90 = vals[int(len(vals) * 0.9)]
    daily = n.get("min") or 0
    max_days = (mx / daily) if daily else 0
    # flag if 100g of richest food covers > 5 days of daily min
    flag = " *** SUSPECT" if daily and max_days > 5 else ""
    if daily and max_days > 2:
        flag = " ** HIGH" if max_days <= 5 else flag
    lines.append(
        f"{n['name']} [{n['units']}] min={daily} n={len(vals)} "
        f"med={med:.4g} p90={p90:.4g} max={mx:.4g} max_days/100g={max_days:.1f}{flag}"
    )

out = ROOT / "_nutrient_audit.txt"
out.write_text("\n".join(lines), encoding="utf-8")
print("wrote", out, "lines", len(lines))
