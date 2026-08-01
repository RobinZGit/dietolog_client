# dietolog_client (simple offline client)

**Один файл:** [`dietolog.html`](dietolog.html) (~0,5–0,6 МБ).

Вся база продуктов и нутриентов **встроена внутрь** HTML как объект `SEED` (внизу скрипта, с комментарием «БАЗА ДАННЫХ»).  
Отдельный `seed.json` в корне **не нужен** — ни для работы, ни для шаринга с сообществом.

## Online

https://robinzgit.github.io/dietolog_client/dietolog.html  

Корень сайта (`…/dietolog_client/`) редиректит на этот файл.  
Если в шапке «залипла» старая `vN` — подождите до ~10 мин (кэш CDN) или откройте raw-ссылку ниже / сделайте жёсткое обновление.

## Offline / Android tablet

1. Откройте страницу выше (или зелёную кнопку **«Скачать HTML с базой»**).
2. Сохраните `dietolog-vXX-offline.html`.
3. Откройте файл в **Chrome**.
4. Поиск, анализ раскладки и «Добавить в раскладку» работают **без интернета**.

Прямая raw-ссылка (тот же один файл):

https://raw.githubusercontent.com/RobinZGit/dietolog_client/gh-pages/dietolog.html

## Для разработчиков

Копия снимка БД для пересборки: `Archive/seed.json` (не используется приложением).

```text
python Archive/scripts/build-simple-dietolog.py
python Archive/scripts/patch-simple-get-modes.py
python Archive/scripts/fix-mojibake-simple.py
```

Исходники Angular — в `Archive/`.
