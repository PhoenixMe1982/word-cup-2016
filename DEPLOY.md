# Пайплайн: отладка → коммит → пуш → деплой

Кратко и по шагам, чтобы **не терять контент** и не ломать прод.

## 0. Где что лежит

- Git-репозиторий — в папке `word-cup-2016/` (не в корне `FanAppWC2026/`).
- Ветка одна — `main`. Фронт **автодеплоится на GitHub Pages** воркфлоу
  `.github/workflows/deploy.yml` при каждом push в `main`.
- Бэкенд (бот/API) — отдельно на Render (см. заметку о deploy-hook).
- В репозиторий коммитим **только исходники**. `dist/`, `screenshots/`,
  `node_modules/`, `.env`, `bot/users.json` — в `.gitignore`.

## 1. ⚠️ Главное правило: rebase перед push (иначе теряется контент)

Бот живых данных постоянно пушит в `main` коммиты `chore: auto-update live-data.json`,
поэтому локальный `main` почти всегда **отстаёт** от `origin/main` на десятки коммитов.

- **Всегда** перед push: `git fetch origin` → `git rebase origin/main`
  (или `git pull --rebase origin main`).
- **Никогда** не делать `git push --force` в `main` — это затрёт автокоммиты бота
  (= потеря данных матчей/таблиц).
- Эти автокоммиты трогают только `live-data.json` и не конфликтуют с правками
  в `src/` — rebase проходит чисто.

```bash
cd word-cup-2016
git add <изменённые-файлы>                 # только нужные src-файлы
git commit -m "Понятное сообщение"
git fetch origin && git rebase origin/main # подтянуть автокоммиты бота под себя
git push origin main                        # триггерит деплой на GitHub Pages
```

## 2. Проверка, что деплой прошёл

`gh` может быть не установлен, а `curl` в песочнице без сети — статус прогона
смотрим через публичный GitHub Actions API (любым доступным fetch-инструментом):

```
https://api.github.com/repos/PhoenixMe1982/word-cup-2016/actions/workflows/deploy.yml/runs?per_page=3
```

Ждём, пока у прогона с нужным `head_sha` будет `status: completed`,
`conclusion: success`.

## 3. Почему «не вижу обновлений» в проде

- GitHub Pages CDN отдаёт старое ещё ~1 минуту → жёсткий рефреш `Ctrl+Shift+R`.
- **Telegram Mini-App агрессивно кэширует webview** → полностью закрыть и заново
  открыть мини-апп (или очистить кэш Telegram). Это самая частая причина.

## 4. Визуальная отладка состояний, которых нет в статике

Состояния вроде «рамка/корона для 1/2/3 места», реальное фото профиля, live/finished
матчи и т.п. до начала турнира в данных не встречаются. Снимаем их headless-Chrome'ом
через чистый CDP (Node 18+, встроенный `WebSocket`, без зависимостей), мокая
Telegram SDK на сетевом уровне + `window.fetch`:

```bash
npm run build                              # preview отдаёт dist — собрать обязательно
npm run screenshot home 1                  # хедер главной, своё место №1 (золото+корона)
npm run screenshot home 2                  # №2 (серебро), 3 (бронза), 12 (чёрная рамка)
npm run screenshot leaderboard             # вкладка лидерборда, топ-3 наряжены
# результат: ./screenshots/*.png
```

Скрипт: `scripts/screenshot-miniapp.mjs`. Тонкости мока — в комментариях скрипта
(перехват `telegram-web-app.js` через `Fetch`, обязательные `offClick`-заглушки,
подавление модалки прогноза через `localStorage`).
