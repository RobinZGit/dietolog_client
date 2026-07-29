# DietologClient

Клиент диетолога (Angular): подбор продуктов и контроль нутриентов.

## Простой просмотр (один HTML)

- Файл: [`simple/dietolog.html`](simple/dietolog.html) — список продуктов → нутриенты на 100 г, данные в **IndexedDB**.
- **GitHub Pages:** https://robinzgit.github.io/dietolog_client/ · простой просмотр: https://robinzgit.github.io/dietolog_client/simple/dietolog.html  
  или ссылка **«простой просмотр»** в заголовке приложения.
- Локально после `npm start`: `/simple/dietolog.html`
- Пересборка снимка: `python3 scripts/build-simple-dietolog.py`

## Документация в репозитории

| Файл | Назначение |
|------|------------|
| [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) | Живой контекст разработки (обновлять при каждом push) |
| [docs/USER_INSTRUCTIONS.md](docs/USER_INSTRUCTIONS.md) | Формулировки запросов пользователя |
| [docs/USER_MANUAL.md](docs/USER_MANUAL.md) | Руководство пользователя |
| [.cursor/rules/project-context.mdc](.cursor/rules/project-context.mdc) | Правило агента: выкладывать и обновлять docs вместе с кодом |

Сервер: [dietolog_server](https://github.com/RobinZGit/dietolog_server).

## Development server

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.2.4.

```bash
npm install
npm start
```

Navigate to `http://localhost:4200/`.

## Build

Run `ng build`. Artifacts go to `dist/`.

## Further help

[Angular CLI Overview and Command Reference](https://angular.io/cli).
