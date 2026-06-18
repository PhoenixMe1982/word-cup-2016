import { useState } from 'react'

// Лого кладётся в public/logo.png (пока его нет — показываем вордмарк).
// Когда файл появится, он подхватится автоматически без правок кода.
const LOGO_SRC = import.meta.env.BASE_URL + 'logo.png'

// Экран загрузки. Висит, пока App не решит, что данные готовы (см. AppShell):
// прячется добавлением класса is-hiding (плавный fade), затем размонтируется.
export default function Splash({ hiding }) {
  const [logoOk, setLogoOk] = useState(true)

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

      <div className="splash-hint text-sm uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.7)' }}>
        Загрузка
      </div>
    </div>
  )
}
