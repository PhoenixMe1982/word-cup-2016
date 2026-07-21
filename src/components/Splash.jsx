import { useState, useEffect } from 'react'

// Лого кладётся в public/logo.png (пока его нет — показываем вордмарк).
// Когда файл появится, он подхватится автоматически без правок кода.
const LOGO_SRC = import.meta.env.BASE_URL + 'logo.png'

// Экран загрузки. Висит, пока App не решит, что данные готовы (см. AppShell):
// прячется добавлением класса is-hiding (плавный fade), затем размонтируется.
// Через столько секунд ожидания объясняем задержку словами.
const SLOW_HINT_MS = 5000

export default function Splash({ hiding }) {
  const [logoOk, setLogoOk] = useState(true)
  // Полоса ползёт к 90% по затухающей и никогда не упирается в край: важно,
  // чтобы долгое ожидание читалось как «идёт работа», а не «зависло». До 100%
  // её доводит уход сплэша (класс is-hiding).
  const [progress, setProgress] = useState(0)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const bar = setInterval(() => {
      setProgress(p => Math.min(90, p + (90 - p) * 0.12 + 1.5))
    }, 220)
    const hint = setTimeout(() => setSlow(true), SLOW_HINT_MS)
    return () => { clearInterval(bar); clearTimeout(hint) }
  }, [])

  return (
    <div className={`splash-screen${hiding ? ' is-hiding' : ''}`}>
      {logoOk ? (
        <img
          src={LOGO_SRC}
          alt="FIFA World Cup 2026"
          className="max-w-[70%] max-h-[40vh] object-contain"
          onError={() => setLogoOk(false)}
        />
      ) : (
        <div className="text-center px-6">
          <div className="text-3xl font-black tracking-wide uppercase leading-tight" style={{ color: '#FFFFFF' }}>
            FIFA World Cup
          </div>
          <div className="text-xl font-black mt-1" style={{ color: '#C9A800', letterSpacing: '0.12em' }}>
            2026™
          </div>
        </div>
      )}

      <div className="splash-foot">
        <div className="splash-bar">
          <div className="splash-bar-fill" style={{ width: (hiding ? 100 : progress) + '%' }} />
        </div>

        <div className="splash-hint text-sm uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Загрузка
        </div>

        {slow && (
          <div className="splash-slow text-xs text-center px-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Сервер просыпается после простоя — это может занять до минуты
          </div>
        )}
      </div>
    </div>
  )
}
