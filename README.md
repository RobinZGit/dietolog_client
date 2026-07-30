# Диетолог (простой HTML)

Один файл **`dietolog.html`** — просмотр продуктов / нутриентов / БАД / анализ раскладки.

## GitHub Pages

**Сайт:** https://robinzgit.github.io/dietolog_client/dietolog.html  

Имя файла не меняем на `index.html` — открывается именно `dietolog.html`.

## Репозиторий

| Путь | Назначение |
|------|------------|
| `dietolog.html` | Рабочее приложение (опубликовано) |
| `seed.json` | Снимок данных (также встроен в HTML) |
| `Archive/` | Старый Angular-проект и скрипты пересборки |

Пересборка из архива (при необходимости):

```bash
cd Archive
python scripts/add-bad-supplements.py
python scripts/build-simple-dietolog.py
python scripts/patch-simple-get-modes.py
python scripts/fix-mojibake-simple.py
```

Контекст и инструкции: `Archive/docs/`.
