# dietolog_client — контекст проекта

> Живой файл контекста для продолжения работы с разных устройств и в Cursor.  
> **Обновлять перед каждым push в репозиторий** — см. `.cursor/rules/project-context.mdc`.  
> Формулировки запросов — `docs/USER_INSTRUCTIONS.md`. Руководство пользователя — `docs/USER_MANUAL.md`.

**Репозиторий:** https://github.com/RobinZGit/dietolog_client  
**Сервер (Postgres):** https://github.com/RobinZGit/dietolog_server  
**Последнее обновление:** 2026-07-29 — заметные ссылки на `simple/dietolog.html` на форме Angular (бар под заголовком + кнопка у ADD)

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
- [ ] Точечное дополнение йода/sparse-нутриентов (маппинг, не полная замена базы).
- [ ] При обновлении `static.datasource.ts` — `python3 scripts/build-simple-dietolog.py` и bump `SEED.version` при необходимости.
- [ ] Судьба дубликата `static.datasource.arrays.ts`.

---

## История сессий

| Дата | Суть |
|------|------|
| 2026-07-29 | Docs/контекст; анализ БД/IndexedDB |
| 2026-07-29 | `simple/dietolog.html` + IDB + ссылка из Angular |
| 2026-07-29 | Деплой GitHub Pages (`gh-pages`), `.nojekyll`, ссылка baseURI |

---

## Запросы пользователя (сводка)

См. `docs/USER_INSTRUCTIONS.md` (п. 4 — старт реализации одного файла / минимальная форма / актуальность БД / ссылка из проекта).
