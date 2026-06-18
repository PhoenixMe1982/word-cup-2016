import { useEffect, useRef } from 'react'
import { useLiveData } from '../LiveDataContext.jsx'
import { fireSalute } from '../salute.js'

const API = (import.meta.env.VITE_API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')
const CELEBRATED_KEY = 'wc2026_celebrated' // matchId -> true для уже отпразднованных

// Единый детектор «угаданных» прогнозов. Смонтирован на уровне App, поэтому
// срабатывает и при заходе на любой экран (догоняющий салют), и при live-зачёте
// очков, пока приложение открыто (LiveDataContext обновляется раз в минуту).
export default function SaluteWatcher() {
  const live = useLiveData()
  const checking = useRef(false)
  // Первый проход этого маунта — только baseline (без салюта): уже засчитанные
  // на момент входа исходы празднует попап «итоги визита», а watcher отвечает
  // лишь за зачёты, происходящие пока приложение открыто.
  const seeded = useRef(false)

  function loadCelebrated() {
    try { return JSON.parse(localStorage.getItem(CELEBRATED_KEY)) || {} }
    catch { return {} }
  }
  function saveCelebrated(map) {
    try { localStorage.setItem(CELEBRATED_KEY, JSON.stringify(map)) } catch { /* приватный режим */ }
  }

  async function check() {
    const initData = window.Telegram?.WebApp?.initData
    if (!initData || checking.current) return
    checking.current = true
    try {
      const headers = { 'x-telegram-init-data': initData }
      const me = await fetch(API + '/api/me', { headers }).then(r => r.ok ? r.json() : null).catch(() => null)
      if (!me?.userId) return
      const preds = await fetch(API + `/api/predictions/${me.userId}`, { headers })
        .then(r => r.ok ? r.json() : null).catch(() => null)
      if (!Array.isArray(preds)) return

      const correct = preds.filter(p => p.pts >= 1)
      const celebrated = loadCelebrated()

      // Baseline при входе: помечаем все уже засчитанные исходы как
      // отпразднованные (их празднует попап «итоги визита»), салют не пускаем.
      // Так избегаем и «залпа» за всю историю, и двойного салюта на входе.
      if (!seeded.current) {
        seeded.current = true
        const seed = { ...celebrated }
        for (const p of correct) seed[p.matchId] = true
        saveCelebrated(seed)
        return
      }

      const fresh = correct.filter(p => !celebrated[p.matchId])
      if (fresh.length === 0) return

      // Один салют на пачку новых исходов; уровень — по лучшему результату.
      const level = fresh.some(p => p.pts === 3) ? 'exact' : 'outcome'
      fireSalute(level)

      const next = { ...celebrated }
      for (const p of fresh) next[p.matchId] = true
      saveCelebrated(next)
    } finally {
      checking.current = false
    }
  }

  // Перепроверяем при каждом обновлении live-данных (раз в минуту) — именно
  // тогда на бэкенде успевают появиться новые засчитанные очки. Завязка на
  // live.matches гарантирует и проверку при первом монтировании.
  useEffect(() => { check() }, [live.matches])

  return null
}
