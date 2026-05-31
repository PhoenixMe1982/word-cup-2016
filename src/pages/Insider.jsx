import { useState } from 'react'
import { NEWS } from '../data.js'

const CATEGORIES = ['Все', 'ИНСАЙД', 'АНАЛИЗ', 'РЕКОРД', 'ТРАВМА', 'ИСТОРИЯ', 'ТЕХНИКА']

function NewsCard({ news, featured }) {
  return (
    <div
      className="rounded-2xl overflow-hidden mb-3"
      style={{
        background: featured
          ? 'linear-gradient(135deg, #1a0a0a 0%, #0a1520 100%)'
          : '#141929',
        border: featured
          ? '1px solid rgba(230,57,70,0.3)'
          : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Featured image area */}
      {featured && (
        <div
          className="h-32 flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a0510, #050a1a)',
          }}
        >
          <div className="text-7xl opacity-30 absolute">{news.emoji}</div>
          <div className="relative z-10 text-center px-4">
            <span
              className="text-[10px] font-black px-2 py-1 rounded-full"
              style={{ background: news.categoryColor + '33', color: news.categoryColor }}
            >
              {news.category}
            </span>
            <div className="text-xs text-gray-400 mt-2">{news.views} просмотров</div>
          </div>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(0deg, rgba(26,10,10,1) 0%, transparent 60%)'
          }} />
        </div>
      )}

      <div className="p-4">
        {!featured && (
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              {news.emoji}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded"
                style={{ background: news.categoryColor + '22', color: news.categoryColor }}
              >
                {news.category}
              </span>
              {news.hot && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: 'rgba(230,57,70,0.2)', color: '#E63946' }}>
                  🔥 ГОРЯЧО
                </span>
              )}
            </div>
          </div>
        )}

        <h3 className={`font-black text-white mb-2 leading-snug ${featured ? 'text-base' : 'text-sm'}`}>
          {news.title}
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{news.summary}</p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-gray-600">
            <span>🕐 {news.time}</span>
            <span>👁 {news.views}</span>
          </div>
          <button
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}
          >
            Читать →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Insider() {
  const [cat, setCat] = useState('Все')
  const [searchQ, setSearchQ] = useState('')

  const filtered = NEWS.filter((n) => {
    if (cat !== 'Все' && n.category !== cat) return false
    if (searchQ && !n.title.toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  })

  const hotCount = NEWS.filter((n) => n.hot).length

  return (
    <div className="page-content">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-4"
        style={{ background: 'linear-gradient(180deg, #1a0a0a 0%, #06080f 100%)' }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-gray-500 mb-1">ЧМ 2026</p>
            <h1 className="text-2xl font-black text-white">Инсайды</h1>
            <p className="text-xs text-gray-400 mt-0.5">Новости и аналитика</p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.3)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#E63946] animate-pulse2" />
            <span className="text-[10px] font-bold text-[#E63946]">{hotCount} горячих</span>
          </div>
        </div>

        {/* Search */}
        <div
          className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-gray-500">🔍</span>
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Поиск новостей..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
          />
          {searchQ && (
            <button onClick={() => setSearchQ('')} className="text-gray-500 text-sm">✕</button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
              style={{
                background: cat === c ? '#E63946' : 'rgba(255,255,255,0.06)',
                color: cat === c ? '#fff' : '#9ca3af',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      <div className="px-4 mt-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">Ничего не найдено</div>
        ) : (
          filtered.map((n, i) => (
            <NewsCard key={n.id} news={n} featured={i === 0 && cat === 'Все' && !searchQ} />
          ))
        )}
      </div>
    </div>
  )
}
