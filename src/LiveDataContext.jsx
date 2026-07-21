import { createContext, useContext, useState, useEffect } from 'react'
import { MATCHES, KNOCKOUT_MATCHES, knockoutEnabled, TOP_SCORERS, GOALKEEPERS, GROUPS, NEWS, TICKER_ITEMS } from './data.js'

// Источник матчей: группа всегда; плей-офф подмешивается только при включённой
// фиче (гейт KNOCKOUT_LIVE / тест-флаг). Вычисляется один раз при загрузке модуля.
const SOURCE_MATCHES = knockoutEnabled() ? [...MATCHES, ...KNOCKOUT_MATCHES] : MATCHES

const API = (import.meta.env.VITE_API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

// Пока приложение открыто, перечитываем /api/live раз в минуту —
// бэкенд сам опрашивает football-data.org каждые 5 минут.
const REFRESH_MS = 60 * 1000

// Потолок ожидания Render. Сервис живёт на free-плане: после 15 минут простоя
// он засыпает и первый запрос висит ~50 с, пока поднимается контейнер (молча —
// это не ошибка, .catch такое не ловит). Даём ему проснуться, но не бесконечно,
// чтобы висящие запросы не копились от рефреша к рефрешу.
const API_TIMEOUT_MS = 60 * 1000

// Сборка, на которой реально работает открытая вкладка (подставляется Vite-define
// на билде). В dev/тестах константы нет → 'dev', проверку обновлений пропускаем.
const RUNNING_BUILD = (typeof __BUILD_ID__ !== 'undefined') ? __BUILD_ID__ : 'dev'

const FALLBACK = {
  matches: SOURCE_MATCHES,
  scorers: TOP_SCORERS,
  goalkeepers: GOALKEEPERS,
  groups: GROUPS,
  news: NEWS,
  ticker: TICKER_ITEMS,
}

// Турнирные таблицы групп считаются из завершённых матчей:
// победа 3 очка, ничья 1, сортировка на странице групп — очки → разница → забитые.
// includeLive=true — провизорный режим: идущие матчи засчитываются по текущему
// счёту «как будто матч закончился сейчас» (для живой карточки группы на главной).
export function computeGroups(matches, { includeLive = false } = {}) {
  const groups = JSON.parse(JSON.stringify(GROUPS))
  const rowByCode = {}
  for (const g of Object.values(groups)) for (const t of g.teams) rowByCode[t.code] = t

  for (const m of matches) {
    if (m.stage) continue // плей-офф не влияет на групповые таблицы
    if (m.scoreHome == null || m.scoreAway == null) continue
    // Зачёт: завершённые — всегда. В провизорном режиме — любой НЕзавершённый
    // матч, по которому уже есть счёт (идёт сейчас). ВАЖНО: бэкенд держит in-play
    // матч в статусе 'upcoming' и просто пушит текущий счёт (status не меняется
    // на 'live'), поэтому ориентируемся на наличие счёта, а не на статус 'live' —
    // иначе провизорная таблица не пересчитывалась бы при изменении счёта.
    const counts = m.status === 'finished' || (includeLive && m.status !== 'finished')
    if (!counts) continue
    const h = rowByCode[m.home]
    const a = rowByCode[m.away]
    if (!h || !a) continue
    h.p++; a.p++
    h.gf += m.scoreHome; h.ga += m.scoreAway
    a.gf += m.scoreAway; a.ga += m.scoreHome
    if (m.scoreHome > m.scoreAway)      { h.w++; a.l++; h.pts += 3 }
    else if (m.scoreHome < m.scoreAway) { a.w++; h.l++; a.pts += 3 }
    else                                { h.d++; a.d++; h.pts++; a.pts++ }
    h.gd = h.gf - h.ga
    a.gd = a.gf - a.ga
  }
  return groups
}

const LiveDataCtx = createContext(FALLBACK)

export function LiveDataProvider({ children }) {
  const [data, setData] = useState(FALLBACK)
  // ready — статика (live-data.json) загружена, показывать уже есть что.
  // Сплэш на уровне App держит вход, пока это false, чтобы не показывать
  // пустые счета из FALLBACK (в data.js результатов нет вообще). На ответы
  // Render НЕ завязано — см. loadApi ниже.
  const [ready, setReady] = useState(false)
  // updateAvailable — задеплоена сборка новее текущей открытой вкладки; App
  // показывает мягкую плашку «Обновить». Взводится один раз и не сбрасывается.
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    let cancelled = false

    // Последние успешные ответы каждого источника. Держим отдельно и рендерим
    // из объединения, чтобы медленный Render не затирал уже показанную статику,
    // а неудачный запрос не обнулял то, что пользователь уже видит.
    const snap = { json: null, apiLive: null, apiScorers: null, apiKeepers: null }

    function apply() {
      if (cancelled) return
      // Приоритет: /api/live (свежее, раз в 5 мин) → live-data.json (GitHub Actions) → статика
      const staticResults = snap.json?.matchResults || {}
      const liveResults = snap.apiLive?.matchResults && Object.keys(snap.apiLive.matchResults).length > 0
        ? snap.apiLive.matchResults
        : null

      const matches = SOURCE_MATCHES.map(m => ({
        ...m,
        ...(staticResults[m.id] || {}),
        ...((liveResults && liveResults[m.id]) || {}),
      }))

      setData({
        matches,
        scorers:     snap.apiScorers  || snap.json?.scorers     || [],
        goalkeepers: snap.apiKeepers  || snap.json?.goalkeepers || GOALKEEPERS,
        groups:      computeGroups(matches),
        news:        snap.json?.news    || NEWS,
        ticker:      snap.json?.ticker  || TICKER_ITEMS,
      })
    }

    // (1) Статика лежит на тех же GitHub Pages, что и сам фронт: отвечает
    // мгновенно, даже когда Render спит. Именно она снимает сплэш — результаты
    // матчей полные, так что входу больше не нужно ждать бэкенд.
    async function loadStatic() {
      const t = Date.now()
      const [json, ver] = await Promise.all([
        fetch(import.meta.env.BASE_URL + 'live-data.json?t=' + t).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(import.meta.env.BASE_URL + 'version.json?t=' + t).then(r => r.ok ? r.json() : null).catch(() => null),
      ])
      if (cancelled) return

      if (json) snap.json = json
      // Новая сборка на сервере → плашка «Обновить» (только в собранном приложении).
      if (RUNNING_BUILD !== 'dev' && ver?.build && ver.build !== RUNNING_BUILD) {
        setUpdateAvailable(true)
      }
      apply()
      setReady(true) // даже если статика не пришла — дальше держать сплэш нечем
    }

    // (2) Render. Ответы домешиваются поверх статики, когда придут: на free-плане
    // холодный старт занимает ~50 с, и блокировать на это вход нельзя.
    // Cache-bust обязателен: без ?t=… WebView Telegram кэшировал /api/live и
    // 60-сек. рефреш возвращал устаревший счёт.
    async function loadApi() {
      const ctl = new AbortController()
      const kill = setTimeout(() => ctl.abort(), API_TIMEOUT_MS)
      const t = Date.now()
      const get = (path) => fetch(`${API}${path}?t=${t}`, { signal: ctl.signal })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null) // сюда же попадает abort по таймауту
      const [apiLive, apiScorers, apiKeepers] = await Promise.all([
        get('/api/live'), get('/api/scorers'), get('/api/goalkeepers'),
      ])
      clearTimeout(kill)
      if (cancelled) return

      if (apiLive)    snap.apiLive    = apiLive
      if (apiScorers) snap.apiScorers = apiScorers
      if (apiKeepers) snap.apiKeepers = apiKeepers
      if (apiLive || apiScorers || apiKeepers) apply()
    }

    loadStatic()
    loadApi()
    const t = setInterval(() => { loadStatic(); loadApi() }, REFRESH_MS)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  return <LiveDataCtx.Provider value={{ ...data, ready, updateAvailable }}>{children}</LiveDataCtx.Provider>
}

export const useLiveData = () => useContext(LiveDataCtx)
