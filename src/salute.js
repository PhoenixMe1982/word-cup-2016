import confetti from 'canvas-confetti'

// Фейерверк-салют поверх всего экрана. Два уровня:
//   'exact'   — точный счёт (pts=3): мощный, золото + триколор, несколько залпов;
//   'outcome' — угадан исход (pts=1): один скромный залп.
//
// Canvas-confetti сам создаёт fullscreen <canvas> с pointer-events:none и
// убирает его, когда частицы осели — тапы по кнопкам не блокируются.

const GOLD = ['#FFD700', '#FFC400', '#FF8C00', '#FFFFFF']
const FIFA = ['#C9A800', '#16a34a', '#2563eb', '#ef4444', '#FFFFFF']

function haptic(type) {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type)
  } catch { /* нет Telegram — молча пропускаем */ }
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

// Залпы из левого и правого нижних углов в течение duration мс.
function cannons({ duration, perFrame, colors, scalar }) {
  const end = Date.now() + duration
  ;(function frame() {
    confetti({
      particleCount: perFrame, angle: 60, spread: 60,
      startVelocity: 55, origin: { x: 0, y: 0.9 }, colors, scalar,
      disableForReducedMotion: true,
    })
    confetti({
      particleCount: perFrame, angle: 120, spread: 60,
      startVelocity: 55, origin: { x: 1, y: 0.9 }, colors, scalar,
      disableForReducedMotion: true,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

// Разрыв-«звезда» в случайной точке верхней половины экрана.
function burst(colors) {
  confetti({
    particleCount: 90, spread: 360, startVelocity: 35, ticks: 90,
    origin: { x: 0.2 + Math.random() * 0.6, y: 0.2 + Math.random() * 0.25 },
    colors, scalar: 1.1, disableForReducedMotion: true,
  })
}

export function fireSalute(level = 'outcome') {
  // Уважаем системную настройку «уменьшить движение»: салют не пускаем,
  // но тактильный отклик оставляем — он не «движение» на экране.
  if (prefersReducedMotion()) {
    haptic('success')
    return
  }

  if (level === 'exact') {
    haptic('success')
    cannons({ duration: 1800, perFrame: 7, colors: GOLD, scalar: 1.2 })
    burst(GOLD)
    setTimeout(() => burst(FIFA), 350)
    setTimeout(() => burst(GOLD), 750)
  } else {
    haptic('success')
    cannons({ duration: 900, perFrame: 4, colors: FIFA, scalar: 1 })
  }
}

// Только в dev: вызвать салют из консоли браузера — fireSalute('exact') / fireSalute('outcome').
// В прод-сборку не попадает (Vite вырезает блок по import.meta.env.DEV).
if (import.meta.env.DEV) {
  window.fireSalute = fireSalute
}
