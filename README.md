# dietolog_client (simple offline client)

One-file app: **`dietolog.html`** (~0.5–0.6 MB). The full product/nutrient database is **embedded** at the **bottom** of the HTML (`const SEED = …`, section «ВСТРОЕННАЯ БАЗА ДАННЫХ»). No server and no separate `seed.json` are required at runtime.

## Online

https://robinzgit.github.io/dietolog_client/dietolog.html

## Offline / Android tablet

1. Open the page above (or use the green button **«Скачать HTML с базой»**).
2. Save `dietolog-vXX-offline.html` to Downloads / Files.
3. Open that file in **Chrome** (or another browser that can open local HTML).
4. Search, layout analysis, and «Создать новый список» work **without internet**.

Direct raw file (same content as Pages):

https://raw.githubusercontent.com/RobinZGit/dietolog_client/gh-pages/dietolog.html

`seed.json` in the repo is only for rebuilds / tooling — the app does not fetch it.

## Rebuild (developers)

From repo root:

```text
python Archive/scripts/build-simple-dietolog.py
python Archive/scripts/patch-simple-get-modes.py
python Archive/scripts/fix-mojibake-simple.py
```

Angular sources live under `Archive/`.
