# -*- coding: utf-8 -*-
"""Find clear food outliers (exclude BAD and dried spices)."""
import json, re
from pathlib import Path

html = Path("simple/dietolog.html").read_text(encoding="utf-8")
m = re.search(r"JSON\.parse\(\s*(\[[\s\S]*?\])\.join\(\"\"\)\s*\)", html[html.find("const SEED") :])
seed = json.loads("".join(json.loads(m.group(1))))
nutrients = {n["id"]: n for n in seed["nutrients"]}
products = {p["id"]: p for p in seed["products"]}
info = {int(k): v for k, v in seed["info"].items()}

SPICE_RE = re.compile(r"сушен|молот|специ|перец|базилик|гвоздик|кориц|кардамон|куркум|орегано|тимьян|мята|лавровый|майоран|фенхель|имбирь|шалфей", re.I)

lines = []
for n in seed["nutrients"]:
    daily = n.get("min") or 0
    if not daily:
        continue
    rows = []
    for pid, items in info.items():
        p = products.get(pid, {})
        if p.get("section") == "bad":
            continue
        if (p.get("group") or "") == "Специи и приправы" or SPICE_RE.search(p.get("name") or ""):
            continue
        for nid, val in items:
            if nid == n["id"] and val > 0 and (val / daily) >= 3:
                rows.append((val / daily, val, pid, p.get("name"), p.get("group")))
    if not rows:
        continue
    rows.sort(reverse=True)
    lines.append(f"{n['name']} [{n['units']}] min={daily}")
    for r in rows[:10]:
        lines.append(f"  {r[0]:.1f}x  val={r[1]}  {r[3]} ({r[4]})")

Path("_food_outliers.txt").write_text("\n".join(lines), encoding="utf-8")
print("outliers lines", len(lines))
