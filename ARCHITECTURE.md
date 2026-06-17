# Архитектура приложения — FIFA World Cup 2026

Снимок состояния на 2026-06-16. Документ фиксирует, **что есть в аппке, как
это работает и как деплоится**. Дополняет [README.md](README.md) (краткое описание)
и [DEPLOY.md](DEPLOY.md) (пошаговый пайплайн релиза).

---

## 1. Что это

Telegram Mini-App о Чемпионате мира по футболу 2026. Контент о турнире
(матчи, группы, бомбардиры, история ЧМ) + **игра-прогнозы**: пользователь
предсказывает счёт матчей, за угаданное начисляются очки, есть лидерборд.

Интерфейс на русском языке. Открывается как мини-апп внутри Telegram-бота,
а также доступен как обычный веб-сайт.

---

## 2. Технологический стек

| Слой        | Технологии                                                        |
|-------------|-------------------------------------------------------------------|
| Фронтенд    | React 18 · Vite 5 · Tailwind CSS 3 · react-router-dom (не активен — навигация через вкладки) |
| Эффекты     | `canvas-confetti` (салют при угаданном прогнозе)                  |
| Бэкенд      | Node.js · Express · grammY (Telegram-бот) · Upstash Redis (REST)  |
| Внешние API | football-data.org (live-счёт и бомбардиры, бесплатный тариф)       |
| Хостинг     | Фронт — GitHub Pages · Бэкенд — Render (раньше Railway, см. `bot/railway.json`) |

---

## 3. Структура репозитория

> ⚠️ Git-репозиторий — в папке `word-cup-2016/`, **не** в корне `FanAppWC2026/`.

```
word-cup-2016/
├── src/                      # Фронтенд (React)
│   ├── App.jsx               # Корень: вкладки, модалка прогноза, SaluteWatcher
│   ├── main.jsx              # Точка входа React
│   ├── LiveDataContext.jsx   # Контекст live-данных (опрос раз в минуту)
│   ├── data.js               # Статические данные турнира (fallback)
│   ├── salute.js             # 🎆 Логика салюта (canvas-confetti)
│   ├── utils.js              # Хелперы дат (UTC↔локаль)
│   ├── index.css             # Tailwind + глобальные стили
│   ├── components/
│   │   ├── BottomNav.jsx          # Нижняя навигация (вкладки)
│   │   ├── CountdownTimer.jsx     # Обратный отсчёт до старта ЧМ
│   │   ├── PredictionPanel.jsx    # Панель ввода прогноза
│   │   ├── TournamentProgressBar.jsx
│   │   └── SaluteWatcher.jsx      # 🎆 Детектор угаданных прогнозов
│   ├── pages/                # Home, Schedule, Scorers, Goalkeepers, Groups,
│   │   │                     #   History, Insider, Teams, Leaderboard, PlayPage,
│   │   │                     #   WorldCup, AllTimeScorers, Prediction
│   └── data/                 # h2hData.js, squads.js, teamsData.js
├── bot/                      # Бэкенд (Express API + Telegram-бот)
│   ├── index.js              # API-эндпоинты, бот, поллеры, скоринг
│   ├── match-lookup.js       # TLA-команд → matchId (для football-data.org)
│   ├── names-ru.js           # Транслитерация имён игроков в русский
│   ├── sync-results.js       # Резервный синк результатов (GitHub Actions)
│   └── update-live-data.js   # Генерация public/live-data.json (резерв)
├── public/                   # Статика: баннеры, og-image, live-data.json
├── scripts/screenshot-miniapp.mjs  # Headless-Chrome отладка состояний (CDP)
├── .github/workflows/        # deploy.yml, keep-alive.yml, sync-results.yml, update-live-data.yml
├── vite.config.js            # base-path берётся из VITE_BASE_PATH
└── vercel.json               # Альтернативный деплой (SPA-rewrites)
```

---

## 4. Фронтенд

### Навигация
Одностраничное приложение с вкладками (`App.jsx`, состояние `tab`), не через
react-router. Нижняя панель `BottomNav`. Раздел «Чемпионат» (`WorldCup.jsx`)
имеет под-вкладки (группы / расписание / бомбардиры / вратари / история / инсайды).

Кнопка «Назад» Telegram (`tg.BackButton`) возвращает на главную.

### Разделы
- **🏠 Главная** — обратный отсчёт до старта, ближайшие матчи с инлайн-прогнозом
  (свайп между страницами по 3 матча), последние результаты, топ-бомбардиры,
  аватар с местом в лидерборде.
- **📅 Расписание**, **⚽ Бомбардиры**, **🧤 Вратари**, **🏟️ Группы (12×4)**,
  **🏆 История (1930–2022)**, **📰 Инсайды**.
- **🏆 Лидерборд** — топ-50, своё место, разбор прогнозов (точный счёт / исход / мимо).

### Источник данных (`LiveDataContext.jsx`)
Провайдер раз в минуту собирает данные из трёх источников с приоритетом:
1. `GET {API}/api/live` — свежий счёт (бэкенд опрашивает football-data.org раз в 5 мин);
2. `public/live-data.json` — резерв (GitHub Actions);
3. `src/data.js` — статический fallback.

Турнирные таблицы групп **считаются на клиенте** из завершённых матчей
(победа 3 / ничья 1; сортировка очки → разница → забитые).

### 🎆 Салют при угаданном прогнозе (добавлено 2026-06-16)
Файлы: [src/salute.js](src/salute.js), [src/components/SaluteWatcher.jsx](src/components/SaluteWatcher.jsx).

- **Что:** поверх экрана проигрывается фейерверк (`canvas-confetti`) при угадывании.
  Два уровня: `'exact'` (точный счёт, pts=3) — мощный, золото+триколор, несколько
  залпов; `'outcome'` (угадан исход, pts=1) — один скромный залп.
- **Когда:** `SaluteWatcher` смонтирован на уровне App и завязан на обновления
  `LiveDataContext`. Срабатывает (а) **догоняюще** при заходе на любой экран за
  всё, что засчиталось пока приложение было закрыто, и (б) **мгновенно** при
  live-зачёте очков, пока приложение открыто.
- **Защиты от граблей:**
  - дедупликация через `localStorage` (`wc2026_celebrated`) — один салют на матч;
  - **прайминг первого запуска** — при первом открытии все уже засчитанные
    прогнозы помечаются «отпразднованными» молча (иначе залп за всю историю);
    салют только за *новые* угадывания;
  - один салют на пачку новых исходов (уровень — по лучшему результату);
  - `canvas` от библиотеки сам `pointer-events:none` — не блокирует тапы;
  - тактильный отклик `tg.HapticFeedback.notificationOccurred('success')` (только в Telegram).
  - ⚠️ `prefers-reduced-motion` **намеренно НЕ учитывается** (исправлено 2026-06-17):
    на мобильных эта настройка часто включена невидимо (энергосбережение / «убрать
    анимации») и глушила салют целиком — оставалась только вибрация. Салют — короткая
    осознанная награда, поэтому играем всегда.
- **Dev-триггер:** в режиме разработки доступна `window.fireSalute('exact'|'outcome')`
  для вызова из консоли. В прод-сборку не попадает (вырезается по `import.meta.env.DEV`).

---

## 5. Бэкенд (`bot/index.js`)

Один процесс на Render: Express-API + Telegram-бот (grammY) + фоновые поллеры.
Хранилище — **Upstash Redis** (REST API), ключи с префиксом `wc2026_*`.

### REST API
Эндпоинты с `withAuth` требуют заголовок `x-telegram-init-data` (валидация
подписи Telegram initData).

| Метод | Путь                      | Назначение                                |
|-------|---------------------------|-------------------------------------------|
| GET   | `/api/health`             | Health-check (для keep-alive)             |
| GET   | `/api/live`               | Текущий live-счёт всех матчей             |
| GET   | `/api/results`            | Зачтённые результаты                      |
| GET   | `/api/my-predictions` 🔒  | Прогнозы текущего юзера `{matchId:{home,away}}` |
| POST  | `/api/predict` 🔒         | Сохранить прогноз на матч                 |
| GET   | `/api/leaderboard`        | Топ-N лидерборда                          |
| GET   | `/api/scorers`            | Бомбардиры                                |
| GET   | `/api/goalkeepers`        | Вратари                                   |
| GET   | `/api/me` 🔒              | `{userId, pts, rank}` текущего юзера       |
| GET   | `/api/predictions/:userId`| Засчитанные прогнозы юзера `[{matchId, pts, ...}]` |
| POST  | `/api/score`              | Ручная фиксация результата (админ)        |

> 🎆 Салют использует связку `/api/me` (→ userId) + `/api/predictions/:userId` (→ pts).

### Скоринг (`calcPoints`)
- Точный счёт → **3 очка**;
- угадан исход (знак разницы совпал) → **1 очко**;
- иначе → 0.

`settleMatch` идемпотентен: при повторном зачёте того же счёта — пропуск; при
**коррекции** счёта вычитает ранее начисленные очки (`delta = newPts − oldPts`),
чтобы не задваивать лидерборд.

### Фоновые поллеры (setInterval, каждые 5 мин)
- `pollFootballData()` — тянет матчи WC из football-data.org, маппит статусы,
  обновляет `liveState`, **авто-зачитывает** завершённые матчи (`settleMatch`),
  шлёт админу уведомление. Зачтённый в Redis матч — источник истины (API иногда
  откатывает FINISHED→SCHEDULED, понижать статус не даём).
- `pollScorers()` — голы и сыгранные матчи из `/scorers`. Ассисты free-тариф не
  отдаёт → берутся из ручных правок. Привязка по `player.id` (fdId).

> Почему `setInterval`, а не GitHub Actions cron: Render держит сервис 24/7
> (keep-alive), а GitHub троттлит cron до раза в несколько часов.

### Команды бота (только админ)
`/start`, `/stats`, `/score m01 2:1`, `/scorer`, `/keeper`, `/send`, `/result`,
`/photo`, `/help`. Любое сообщение/фото от админа → рассылка всем подписчикам.

---

## 6. Деплой

### Фронтенд → GitHub Pages (автоматически)
`.github/workflows/deploy.yml` при каждом `push` в `main`:
`npm ci` → `npm run build` (с `VITE_BASE_PATH=/word-cup-2016/`,
`VITE_API_URL=https://word-cup-2016.onrender.com`) → публикация `dist/` на Pages.

Прод-URL: **https://phoenixme1982.github.io/word-cup-2016/**

> ⚠️ **Главное правило релиза** (см. [DEPLOY.md](DEPLOY.md)): бот постоянно
> автокоммитит `live-data.json` в `main`, поэтому **перед каждым push** —
> `git fetch origin && git rebase origin/main`. **Никогда** `git push --force`
> в `main` (затрёт данные матчей). Эти автокоммиты не конфликтуют с `src/`.

### Бэкенд → Render
Сервис `word-cup-2016` (`srv-d8gq416k1jcs73da03lg`), деплой через deploy-hook
(POST URL хранится в заметках). Зависший деплой лечится Suspend→Resume.
Конфиг для Railway сохранён в `bot/railway.json` (исторический хостинг).

### Прочие воркфлоу
- `keep-alive.yml` — пингует бэкенд, чтобы Render не засыпал;
- `sync-results.yml`, `update-live-data.yml` — резервный синк (основной путь — поллеры на Render).

---

## 7. Разработка и отладка

```bash
cd word-cup-2016
npm install
npm run dev        # http://localhost:5173
npm run build      # прод-сборка в dist/
npm run preview    # отдать dist/ локально
```

### Скриншот-отладка состояний, которых нет в данных
`npm run screenshot home 1` и т.п. — headless-Chrome через чистый CDP мокает
Telegram SDK и `fetch`, снимает состояния (рамки/короны мест, live/finished
матчи) до появления реальных данных. Скрипт: `scripts/screenshot-miniapp.mjs`.

### Кэш в проде
Если «не вижу обновлений»: GitHub Pages CDN отдаёт старое ~1 мин (`Ctrl+Shift+R`),
а **Telegram агрессивно кэширует webview** — закрыть и заново открыть мини-апп.
