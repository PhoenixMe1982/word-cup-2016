const RU_MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

// dateStr: "11 июня", timeStr: "22:00 МСК" (MSK = UTC+3)
// Returns { time: "HH:MM", date: "D месяц" } in the device's local timezone
export function toLocalDateTime(dateStr, timeStr) {
  const timePart = (timeStr || '').split(' ')[0]
  const [hStr, mStr] = timePart.split(':')
  const h = parseInt(hStr)
  const m = parseInt(mStr)
  const parts = (dateStr || '').trim().split(' ')
  const day = parseInt(parts[0])
  const monthIdx = RU_MONTHS.indexOf(parts[1]?.toLowerCase())
  if (isNaN(day) || monthIdx === -1 || isNaN(h) || isNaN(m)) {
    return { time: timeStr, date: dateStr }
  }
  // MSK is UTC+3 — subtract 3h to get UTC
  const utcMs = Date.UTC(2026, monthIdx, day, h - 3, m)
  const d = new Date(utcMs)
  const localH = d.getHours().toString().padStart(2, '0')
  const localM = d.getMinutes().toString().padStart(2, '0')
  return {
    time: `${localH}:${localM}`,
    date: `${d.getDate()} ${RU_MONTHS[d.getMonth()]}`,
  }
}
