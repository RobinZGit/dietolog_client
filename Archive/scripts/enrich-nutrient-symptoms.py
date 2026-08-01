#!/usr/bin/env python3
"""Добавить справочник симптомов и связи дефицит/избыток к нутриентам.

Обновляет Archive/seed.json и встраивает SEED в корневой dietolog.html.
Схема:
  symptoms: [{id, name}, ...]
  nutrient.deficiency: [symptomId, ...]
  nutrient.excess: [symptomId, ...]
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

ARCHIVE = pathlib.Path(__file__).resolve().parents[1]
REPO = ARCHIVE.parent
SEED_PATH = ARCHIVE / "seed.json"
HTML_PATH = REPO / "dietolog.html"
VERSION = 41
SOURCE = "dietolog_client · v41 nutrient deficiency/excess symptoms"
CHUNK = 120000

SEED_COMMENT = """\
/* =============================================================================
 * БАЗА ДАННЫХ (SEED) — снимок продуктов и нутриентов, встроенный в этот HTML
 * =============================================================================
 * Это и есть вся БД «Диетолога» (nutrients / products / info / symptoms).
 * Файл самодостаточен: отдельный seed.json НЕ нужен для работы и для шаринга.
 * Скачайте / сохраните только dietolog.html — база уже внутри.
 * Для разработчиков копия снимка лежит в Archive/seed.json (пересборка).
 * =============================================================================
 */
"""

# Справочник симптомов (id стабильны).
SYMPTOMS: list[dict] = [
    {"id": 1, "name": "Усталость, слабость"},
    {"id": 2, "name": "Снижение работоспособности"},
    {"id": 3, "name": "Головная боль"},
    {"id": 4, "name": "Головокружение"},
    {"id": 5, "name": "Раздражительность"},
    {"id": 6, "name": "Тревожность"},
    {"id": 7, "name": "Бессонница / нарушение сна"},
    {"id": 8, "name": "Депрессивное настроение"},
    {"id": 9, "name": "Снижение концентрации внимания"},
    {"id": 10, "name": "Сухость кожи"},
    {"id": 11, "name": "Зуд кожи"},
    {"id": 12, "name": "Выпадение волос"},
    {"id": 13, "name": "Ломкость ногтей"},
    {"id": 14, "name": "Бледность кожи"},
    {"id": 15, "name": "Отёки"},
    {"id": 16, "name": "Мышечные судороги"},
    {"id": 17, "name": "Мышечная слабость"},
    {"id": 18, "name": "Боли в мышцах"},
    {"id": 19, "name": "Боли в суставах"},
    {"id": 20, "name": "Ломкость костей / риск остеопороза"},
    {"id": 21, "name": "Частые простуды, снижение иммунитета"},
    {"id": 22, "name": "Медленное заживление ран"},
    {"id": 23, "name": "Кровоточивость дёсен"},
    {"id": 24, "name": "Синяки без причины"},
    {"id": 25, "name": "Ночная слепота / ухудшение зрения в сумерках"},
    {"id": 26, "name": "Сухость глаз"},
    {"id": 27, "name": "Трещины в углах рта (хейлит)"},
    {"id": 28, "name": "Воспаление языка (глоссит)"},
    {"id": 29, "name": "Покалывание / онемение конечностей"},
    {"id": 30, "name": "Нарушение координации"},
    {"id": 31, "name": "Сердцебиение / аритмия"},
    {"id": 32, "name": "Повышение артериального давления"},
    {"id": 33, "name": "Снижение аппетита"},
    {"id": 34, "name": "Тошнота"},
    {"id": 35, "name": "Запоры"},
    {"id": 36, "name": "Диарея"},
    {"id": 37, "name": "Вздутие живота"},
    {"id": 38, "name": "Жажда"},
    {"id": 39, "name": "Частое мочеиспускание"},
    {"id": 40, "name": "Набор веса"},
    {"id": 41, "name": "Потеря веса"},
    {"id": 42, "name": "Зябкость / зябнут руки и ноги"},
    {"id": 43, "name": "Повышенная чувствительность к холоду"},
    {"id": 44, "name": "Увеличение щитовидной железы (зоб)"},
    {"id": 45, "name": "Учащённый пульс"},
    {"id": 46, "name": "Замедленный пульс"},
    {"id": 47, "name": "Потливость"},
    {"id": 48, "name": "Металлический привкус во рту"},
    {"id": 49, "name": "Потемнение зубов / флюороз"},
    {"id": 50, "name": "Кариес"},
    {"id": 51, "name": "Онемение губ / лица"},
    {"id": 52, "name": "Тремор"},
    {"id": 53, "name": "Сухость слизистых"},
    {"id": 54, "name": "Перхоть / шелушение кожи головы"},
    {"id": 55, "name": "Ухудшение заживления переломов"},
    {"id": 56, "name": "Склонность к кровотечениям"},
    {"id": 57, "name": "Анемия (снижение гемоглобина)"},
    {"id": 58, "name": "Одышка при нагрузке"},
    {"id": 59, "name": "Снижение либидо"},
    {"id": 60, "name": "Нарушение вкуса / обоняния"},
    {"id": 61, "name": "Белые пятна на ногтях"},
    {"id": 62, "name": "Гипергликемия / скачки сахара"},
    {"id": 63, "name": "Гипогликемия / дрожь от голода"},
    {"id": 64, "name": "Камни в почках (риск)"},
    {"id": 65, "name": "Мочевая кислота / подагра (риск)"},
    {"id": 66, "name": "Кожный зуд и сыпь"},
    {"id": 67, "name": "Пигментация кожи"},
    {"id": 68, "name": "Спутанность сознания"},
    {"id": 69, "name": "Сухость и ломкость волос"},
    {"id": 70, "name": "Отёчность лица"},
    {"id": 71, "name": "Изжога"},
    {"id": 72, "name": "Снижение мышечной массы"},
    {"id": 73, "name": "Повышенный холестерин (риск)"},
    {"id": 74, "name": "Проблемы с печенью (риск)"},
    {"id": 75, "name": "Тошнота и рвота"},
    {"id": 76, "name": "Потеря аппетита и металлический привкус"},
    {"id": 77, "name": "Покраснение кожи / «приливы»"},
    {"id": 78, "name": "Жжение и покалывание кожи"},
    {"id": 79, "name": "Ухудшение памяти"},
    {"id": 80, "name": "Сонливость днём"},
]

# Связи: nutrient id → (deficiency symptom ids, excess symptom ids).
# Если max у нутриента нет/не используется — excess можно оставить [], UI не покажет избыток.
NUTRIENT_SYMPTOMS: dict[int, tuple[list[int], list[int]]] = {
    # Калорийность
    3: ([1, 2, 41, 33], [40, 47, 32]),
    # Углеводы
    2: ([1, 3, 5, 63, 9], [40, 62, 80]),
    # Крахмал
    53: ([1, 63, 9], [40, 62, 37]),
    # Жиры
    1: ([1, 10, 69, 59, 43], [40, 73, 71]),
    # Белки
    0: ([1, 72, 17, 21, 22], [64, 65, 74, 34]),
    # Сахара
    45: ([1, 63, 5], [40, 62, 50, 47]),
    # Пищевые волокна
    46: ([35, 37, 62], [37, 36, 33]),
    # Натрий
    22: ([4, 16, 31, 1, 33], [32, 15, 38, 39]),
    # Хлор
    25: ([17, 1, 34], [38, 15, 32]),
    # Калий
    18: ([16, 17, 31, 35, 1], [31, 34, 68, 17]),
    # Сера
    23: ([10, 12, 22, 21], [36, 34, 66]),
    # Фосфор
    24: ([17, 20, 1, 33], [20, 64, 11]),
    # Кальций
    19: ([16, 20, 19, 5, 13], [64, 35, 17, 34]),
    # Витамин В4 (холин)
    16: ([9, 8, 74, 79], [34, 47, 36, 68]),
    # Магний
    21: ([16, 18, 5, 7, 31], [36, 34, 17, 68]),
    # Холестерин
    47: ([1, 10, 59], [73, 32, 74]),
    # Витамин С
    11: ([21, 23, 22, 1, 24], [36, 64, 34, 11]),
    # Кремний
    20: ([13, 20, 69, 12], [11, 34]),
    # Витамин РР (ниацин)
    15: ([1, 10, 28, 36, 8], [77, 11, 74, 3]),
    # Витамин В3
    7: ([1, 10, 28, 5, 8], [77, 34, 74]),
    # Витамин Е
    13: ([17, 21, 10, 12, 22], [34, 36, 56, 3]),
    # Железо
    17: ([57, 1, 14, 58, 42], [34, 35, 74, 48]),
    # Цинк
    43: ([21, 22, 12, 60, 59], [34, 33, 60, 17]),
    # Марганец
    32: ([20, 19, 9, 62], [52, 5, 68, 17]),
    # Витамин В5
    52: ([1, 5, 7, 33, 51], [36, 34]),
    # Витамин В6
    8: ([5, 8, 57, 29, 28], [29, 30, 68, 7]),
    # Ванадий
    28: ([62, 1, 2], [36, 75, 74, 48]),
    # Витамин В1
    5: ([1, 5, 5, 17, 29, 33], [3, 5, 34]),
    # Витамин А
    4: ([25, 26, 10, 21, 53], [3, 34, 67, 74, 15]),
    # Витамин В2
    6: ([27, 28, 10, 1, 26], [11, 34]),
    # Витамин Н (биотин)
    14: ([12, 69, 10, 13, 54], [66, 11]),
    # Медь
    33: ([57, 1, 12, 22, 29], [34, 74, 48, 18]),
    # Фтор
    41: ([50, 20], [49, 19, 34]),
    # Бор
    27: ([20, 19, 17], [34, 36, 66]),
    # Молибден
    34: ([1, 65, 33], [65, 19, 34]),
    # Витамин В9 (фолат)
    9: ([57, 1, 5, 28, 79], [7, 66, 68]),
    # Хром
    42: ([62, 63, 1, 40], [66, 34, 74]),
    # Йод
    29: ([44, 1, 41, 43, 12], [44, 45, 47, 5, 41]),
    # Кобальт
    30: ([57, 1, 14], [66, 3, 34, 74]),
    # Селен
    38: ([21, 12, 17, 59, 43], [34, 12, 48, 74, 51]),
    # Никель
    35: ([1, 57], [66, 11, 34, 48]),
    # Витамин D
    12: ([20, 17, 19, 8, 21], [34, 38, 64, 17, 68]),
    # Витамин В12
    10: ([57, 1, 29, 30, 79, 8], [66, 11]),
}


def inject_seed_into_html(seed: dict) -> None:
    if not HTML_PATH.exists():
        raise SystemExit(f"HTML missing: {HTML_PATH}")
    html = HTML_PATH.read_text(encoding="utf-8")
    seed_json = json.dumps(seed, ensure_ascii=False, separators=(",", ":"))
    chunks = [seed_json[i : i + CHUNK] for i in range(0, len(seed_json), CHUNK)]
    chunks_js = ",\n".join(json.dumps(c, ensure_ascii=False) for c in chunks)
    new_block = SEED_COMMENT + "const SEED = JSON.parse(\n[\n" + chunks_js + '\n].join("")\n);'

    m = re.search(
        r"(?:/\* ={5,}[\s\S]*?БАЗА ДАННЫХ[\s\S]*?\*/\s*)?"
        r"const SEED = JSON\.parse\(\s*\[[\s\S]*?\]\.join\(\"\"\)\s*\);",
        html,
    )
    if not m:
        m = re.search(
            r"const SEED = JSON\.parse\(\s*\[[\s\S]*?\]\.join\(\"\"\)\s*\);",
            html,
        )
    if not m:
        raise SystemExit("SEED block not found in HTML")
    html = html[: m.start()] + new_block + html[m.end() :]
    html = re.sub(
        r"(Диетолог — простой )v\d+",
        rf"\g<1>v{VERSION}",
        html,
    )
    html = re.sub(
        r'(id="appVersion" class="ver">)v\d+',
        rf"\g<1>v{VERSION}",
        html,
    )
    html = re.sub(r"const DB_VERSION = \d+;", f"const DB_VERSION = {VERSION};", html)
    HTML_PATH.write_text(html, encoding="utf-8")


def main() -> int:
    if not SEED_PATH.exists():
        print("missing", SEED_PATH, file=sys.stderr)
        return 1

    seed = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    known = {s["id"] for s in SYMPTOMS}
    for nid, (defs, excs) in NUTRIENT_SYMPTOMS.items():
        for sid in defs + excs:
            if sid not in known:
                raise SystemExit(f"unknown symptom id {sid} for nutrient {nid}")

    nutrients = []
    missing = []
    for n in seed["nutrients"]:
        nid = int(n["id"])
        pair = NUTRIENT_SYMPTOMS.get(nid)
        if not pair:
            missing.append(nid)
            defs, excs = [], []
        else:
            defs, excs = pair
        # unique preserve order
        defs = list(dict.fromkeys(defs))
        excs = list(dict.fromkeys(excs))
        nn = dict(n)
        nn["deficiency"] = defs
        nn["excess"] = excs
        nutrients.append(nn)

    if missing:
        print("WARNING: nutrients without symptom map:", missing, file=sys.stderr)

    seed["version"] = VERSION
    seed["source"] = SOURCE
    seed["symptoms"] = SYMPTOMS
    seed["nutrients"] = nutrients

    SEED_PATH.write_text(
        json.dumps(seed, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print(
        "wrote",
        SEED_PATH,
        "symptoms",
        len(SYMPTOMS),
        "nutrients",
        len(nutrients),
        "with def",
        sum(1 for n in nutrients if n.get("deficiency")),
        "with exc",
        sum(1 for n in nutrients if n.get("excess")),
    )
    inject_seed_into_html(seed)
    print("updated", HTML_PATH, "bytes", HTML_PATH.stat().st_size)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
