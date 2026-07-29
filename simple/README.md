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

UI v1: поиск по продуктам → раскрытие продукта → нутриенты и количество на 100 г.
