# simple/ — однофайловый просмотр диетолога

| Файл | Назначение |
|------|------------|
| **`dietolog.html`** | Один HTML: форма + встроенный снимок БД → **IndexedDB** + GET-режимы |
| **`seed.json`** | Компактный снимок для пересборки (не обязателен для открытия HTML) |

**Pages:** https://robinzgit.github.io/dietolog_client/simple/dietolog.html  

Открыть локально: `simple/dietolog.html` в браузере  
или через Angular: `http://localhost:4200/simple/dietolog.html`  
(папка подключена в `angular.json` → assets).

## GET-режимы

| URL | Что делает |
|-----|------------|
| (без параметров) | Ссылки на режимы + обычный поиск |
| `?mode=nutrients` | Нутриенты → топ‑15 продуктов + % сут. нормы |
| `?mode=layout&items=slug:grams,…` | Анализ раскладки, дефицит, рекомендации, примеры |

Формат `items`: `yajco_kurinoe_celoe:100,grechiha_zerno:150` (латиница, читаемо в строке).  
Также: JSON `[{"n":"slug","g":100}]`, точный id `id:193:100`.

Пересборка групп и снимка (SEED; режимы в HTML сохраняются):

```bash
python3 scripts/assign-product-groups.py
python3 scripts/build-simple-dietolog.py
```

UI **v13+**: поиск → группа → продукт → нутриенты. В `mode=layout`: рекомендации с чекбоксом / корзиной / «Создать новый список»; 34 БАД. См. `docs/BAD_SUPPLEMENTS.md`.
