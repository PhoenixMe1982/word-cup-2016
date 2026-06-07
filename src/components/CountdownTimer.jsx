import { useState, useEffect } from 'react'

function pad(n) {
  return String(n).padStart(2, '0')
}

function splitRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

function TimeUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center" style={{ minWidth: 44 }}>
      <div className="text-2xl font-black score-number" style={{ color: '#111827' }}>{pad(value)}</div>
      <div className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: '#9CA3AF' }}>{label}</div>
    </div>
  )
}

// target: Date — kickoff moment. Renders nothing once it has passed.
export default function CountdownTimer({ target, title, subtitle }) {
  const [remaining, setRemaining] = useState(() => target.getTime() - Date.now())

  useEffect(() => {
    const tick = () => setRemaining(target.getTime() - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  if (remaining <= 0) return null

  const { days, hours, minutes, seconds } = splitRemaining(remaining)

  return (
    <div
      className="mb-4 p-4"
      style={{ background: '#FFFFFF', border: '1px solid rgba(201,168,0,0.25)', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9CA3AF' }}>{title}</div>
        {subtitle && <div className="text-[10px] font-bold" style={{ color: '#C9A800' }}>{subtitle}</div>}
      </div>
      <div className="flex items-center justify-center gap-1.5">
        <TimeUnit value={days} label="дней" />
        <span className="text-lg font-black" style={{ color: 'rgba(0,0,0,0.15)' }}>:</span>
        <TimeUnit value={hours} label="часов" />
        <span className="text-lg font-black" style={{ color: 'rgba(0,0,0,0.15)' }}>:</span>
        <TimeUnit value={minutes} label="минут" />
        <span className="text-lg font-black" style={{ color: 'rgba(0,0,0,0.15)' }}>:</span>
        <TimeUnit value={seconds} label="секунд" />
      </div>
    </div>
  )
}
