import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'
import App from './App.jsx'
import './index.css'

// Windows не отрисовывает эмодзи-флаги (показывает буквенные коды вместо них) —
// полифилл подключает шрифт с флагами только в браузерах без системной поддержки
polyfillCountryFlagEmojis()

const tg = window.Telegram?.WebApp
if (tg) {
  tg.ready()
  tg.expand()
  tg.setHeaderColor?.('#080c15')
  tg.setBackgroundColor?.('#080c15')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
