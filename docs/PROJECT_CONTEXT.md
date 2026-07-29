# dietolog_client — контекст проекта

> Живой файл контекста для продолжения работы с разных устройств и в Cursor.  
> **Обновлять перед каждым push в репозиторий** — см. `.cursor/rules/project-context.mdc`.  
> Формулировки запросов — `docs/USER_INSTRUCTIONS.md`. Руководство пользователя — `docs/USER_MANUAL.md`.

**Репозиторий:** https://github.com/RobinZGit/dietolog_client  
**Сервер (Postgres):** https://github.com/RobinZGit/dietolog_server  
**Последнее обновление:** 2026-07-29 — секция БАД (Ca/Fe/I/Se/D), бренд-шаблон; seed v3; вкладки в simple HTML

---

## Цель проекта

Клиент диетолога: подбор продуктов и контроль нутриентов относительно суточных норм.

- **Angular 15** SPA — полный UI раскладки (`products-and-nutrients`).
- **`simple/dietolog.html`** — один файл: минимальный просмотр (список продуктов → раскрытие → нутриенты на 100 г), данные в **IndexedDB**.

Связанный бэкенд: Spring Boot + PostgreSQL (`jdbc:postgresql://localhost:5432/dietolog`).

---

## Простой клиент (`simple/`)

| Файл | Назначение |
|------|------------|
| `simple/dietolog.html` | HTML+JS+встроенный SEED → IndexedDB `dietolog_simple` |
| `simple/seed.json` | Компактный снимок для пересборки |
| `simple/README.md` | Как открыть / пересобрать |
| `scripts/build-simple-dietolog.py` | Пересборка SEED/HTML из `static.datasource.ts` |

**IndexedDB stores:** `meta`, `nutrients`, `products` (+ index `nameLower`), `byProduct` (ключ = id продукта, `items: [[nutrientId, value], …]`).

**Доступ:** после первого сида продукты/нутриенты/`byProduct` читаются в память (~0.3 МБ) — раскрытие мгновенное; IDB — персистентность и версия снимка (`SEED.version`).

**Открыть:**
- Pages: https://robinzgit.github.io/dietolog_client/simple/dietolog.html  
- или через Angular: заголовок «ДИЕТОЛОГ» → **«простой просмотр»**  
- локально: `simple/dietolog.html` / `ng serve` → `/simple/dietolog.html`

Папка `simple/` в `angular.json` assets. Ссылка строится от `document.baseURI` (корректно для Pages `base-href`).  
**Деплой Pages:** `ng build --configuration production --base-href https://robinzgit.github.io/dietolog_client/` → содержимое `dist/dietolog_client` в ветку `gh-pages`.

---

## Схема данных (общая для сервера и клиента)

| Таблица | Записей (снимок) | Поля (ключевые) |
|---------|------------------|-----------------|
| `nutrients` | **43** | id, name, units, min/max |
| `products` | **1231** | id, name |
| `info` / `byProduct` | **~26k** ненулевых | product → [[nutrient, value], …] на 100 г |

Источник снимка: `static.datasource.ts` (= логика Postgres / dietolog_server). Ссылки `info` нутриентов: **edaplus.info**.

### Покрытие (дыры)

- Макросы / Ca / K / Fe — ~90–99% продуктов.
- **Йод:** ~10% продуктов (128/1231). Аналогично редки V, Si, B, D, Cr, F, Co, Mo…

### Внешние БД (анализ, полный импорт не делали — долго / другой каталог продуктов)

| Источник | Продукты (порядок) | Нутриенты | Заметки |
|----------|-------------------|-----------|---------|
| **Наш снимок** | 1231 | 43 | Русские имена, уже в UI |
| **USDA SR Legacy** | ~7793 | до ~150 | Шире состав; EN; йод неполный |
| **USDA/FDA/ODS Iodine DB** | отдельные продукты | йод | Хорош для точечного дополнения йода |
| **FoodData Central Branded** | очень много | этикетки | Гигабайты; не для одного HTML |

Решение на сейчас: **не** тащить USDA целиком в v1 (маппинг имён долгий, раздувание). Атуальность = актуальный снимок из нашего источника в IDB; расширение йода — отдельной задачей точечным `info_extra`.

---

## Что сделано

### 2026-07-29 (секция БАД)

- Отдельные продукты `fastdegree=БАД`: йод 100/200 мкг, кальций 500/1000 мг, железо 10/20 мг, селен 50 мкг, витамин D 10 мкг.
- Компания пока **`БАД-шаблон`** (`scripts/add-bad-supplements.py` → `COMPANY`).
- Кол-во = **шт.**; `info.value = доза×100` под формулу Angular.
- Simple UI: вкладки Все / Продукты / БАДы; Angular: фильтры «Исключить БАД» / «Только БАД».
- Док: `docs/BAD_SUPPLEMENTS.md`; seed **v3**.

### 2026-07-29 (йод USDA R4)

- Анализ sparse-нутриентов; приоритет — йод.
- Добавлены/обновлены значения йода из **USDA/FDA/ODS Iodine Database Release 4** (+ оценки для водорослей без прямого match).
- Новые продукты: «Соль поваренная йодированная», «Нори, морские водоросли сушёные».
- Йод: **128 → 225** продуктов; `simple` seed **version 2**; отчёт `docs/IODINE_ENRICHMENT.md`.
- Скрипт: `scripts/enrich-iodine-from-usda.py`.

### 2026-07-29 (заметные ссылки на форме)

- Под заголовком «ДИЕТОЛОГ»: ссылка «Открыть простой просмотр (IndexedDB) →».
- В панели фильтров рядом с ADD: кнопка **«Простой HTML»**.
- Пересобран и выложен `gh-pages`.

### 2026-07-29 (GitHub Pages)

- Сборка production с `base-href` Pages; `simple/` в артефакте; push в `gh-pages`.
- Ссылка «простой просмотр» через `document.baseURI`.
- Сайт: https://robinzgit.github.io/dietolog_client/ · простой: …/simple/dietolog.html

### 2026-07-29 (simple HTML + IndexedDB)

- Папка `simple/`, файл `dietolog.html` с SEED (~338 КБ JSON) → IndexedDB.
- UI v1: поиск (в т.ч. `\|`), список продуктов, раскрытие → таблица нутриентов и кол-ва на 100 г.
- Ссылка из Angular-заголовка; assets в `angular.json`.
- Скрипт пересборки `scripts/build-simple-dietolog.py`.
- Внешние БД только проанализированы (см. таблицу выше), полный импорт не выполнялся.

### 2026-07-29 (документация процесса)

- `.cursor/rules/project-context.mdc`, `docs/PROJECT_CONTEXT.md`, `USER_INSTRUCTIONS.md`, `USER_MANUAL.md`.

---

## Открытые задачи

- [ ] Действия формы простого клиента (по указаниям Sergey).
- [x] Точечное дополнение йода (USDA R4) — сделано; дальше: V/Si/B/D/Cr и др.
- [ ] Дополнение прочих sparse-нутриентов (ванадий, кремний, бор, D, …).
- [ ] При обновлении `static.datasource.ts` — `python3 scripts/build-simple-dietolog.py` и bump `SEED.version` при необходимости.
- [ ] Судьба дубликата `static.datasource.arrays.ts`.

---

## История сессий

| Дата | Суть |
|------|------|
| 2026-07-29 | Docs/контекст; анализ БД/IndexedDB |
| 2026-07-29 | `simple/dietolog.html` + IDB + ссылка из Angular |
| 2026-07-29 | Деплой GitHub Pages (`gh-pages`), `.nojekyll`, ссылка baseURI |
| 2026-07-29 | Обогащение йодом USDA R4 (128→225), seed v2 |

---

## Запросы пользователя (сводка)

См. `docs/USER_INSTRUCTIONS.md` (п. 4 — старт реализации одного файла / минимальная форма / актуальность БД / ссылка из проекта).
