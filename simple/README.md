# simple/ — однофайловый просмотр диетолога

| Файл | Назначение |
|------|------------|
| **`dietolog.html`** | Один HTML: форма + встроенный снимок БД → **IndexedDB** |
| **`seed.json`** | Компактный снимок для пересборки (не обязателен для открытия HTML) |

Открыть локально: `simple/dietolog.html` в браузере  
или через Angular: `http://localhost:4200/simple/dietolog.html`  
(папка подключена в `angular.json` → assets).

Пересборка снимка из `static.datasource.ts`:

```bash
python3 scripts/build-simple-dietolog.py
```

UI: **продукты** — плоский список → нутриенты на 100 г; **БАДы** — группа → продукт → на 1 шт. Версия снимка в заголовке (v7+).
