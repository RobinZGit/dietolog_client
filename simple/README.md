# simple/ — однофайловый просмотр диетолога

| Файл | Назначение |
|------|------------|
| **`dietolog.html`** | Один HTML: форма + встроенный снимок БД → **IndexedDB** |
| **`seed.json`** | Компактный снимок для пересборки (не обязателен для открытия HTML) |

Открыть локально: `simple/dietolog.html` в браузере  
или через Angular: `http://localhost:4200/simple/dietolog.html`  
(папка подключена в `angular.json` → assets).

Пересборка групп и снимка:

```bash
python3 scripts/assign-product-groups.py
python3 scripts/build-simple-dietolog.py
```

UI **v10+**: поиск → группа → продукт → нутриенты. Все БАДы в группе **БАД**. Вкладок секций нет.
