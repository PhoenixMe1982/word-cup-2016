import { useState } from 'react'
import { useLiveData } from '../LiveDataContext.jsx'
import { HEADER_BANNER_STYLE } from '../data.js'

const CATEGORIES = ['Все', 'ИНСАЙД', 'АНАЛИЗ', 'РЕКОРД', 'ИСТОРИЯ', 'ТЕХНИКА']

function NewsCard({ news, featured }) {
  return (
    <div
      className="overflow-hidden mb-3"
      style={{
        background: '#FFFFFF',
        border: featured
          ? '1px solid rgba(220,38,38,0.15)'
          : '1px solid rgba(0,0,0,0.07)',
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      }}
    >
      {/* Featured image area */}
      {featured && (
        <div
          className="h-32 flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FFF8F8, #F5F6FA)',
          }}
        >
          <div className="text-7xl opacity-20 absolute">{news.emoji}</div>
          <div className="relative z-10 text-center px-4">
            <span
              className="text-[10px] font-black px-2 py-1 uppercase tracking-wider"
              style={{ background: news.categoryColor + '22', color: news.categoryColor, borderRadius: 10 }}
            >
              {news.category}
            </span>
            <div className="text-xs mt-2" style={{ color: '#6B7280' }}>{news.views} просмотров</div>
          </div>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(0deg, rgba(255,255,255,0.95) 0%, transparent 60%)'
          }} />
        </div>
      )}

      <div className="p-4">
        {!featured && (
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-9 h-9 flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 16 }}
            >
              {news.emoji}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wider"
                style={{ background: news.categoryColor + '22', color: news.categoryColor, borderRadius: 10 }}
              >
                {news.category}
              </span>
              {news.hot && (
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wider"
                  style={{ background: 'rgba(220,38,38,0.12)', color: '#DC2626', borderRadius: 10 }}
                >
                  🔥 Горячо
                </span>
              )}
            </div>
          </div>
        )}

        <h3 className={`font-black mb-2 leading-snug ${featured ? 'text-base' : 'text-sm'}`} style={{ color: '#111827' }}>
          {news.title}
        </h3>
        <p className="text-xs leading-relaxed line-clamp-3" style={{ color: '#6B7280' }}>{news.summary}</p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px]" style={{ color: '#9CA3AF' }}>
            <span>🕐 {news.time}</span>
            <span>👁 {news.views}</span>
          </div>
          <button
            className="text-[11px] font-black px-3 py-1.5 transition-colors uppercase tracking-wide"
            style={{ background: 'rgba(201,168,0,0.10)', color: '#C9A800', borderRadius: 16, border: '1px solid rgba(201,168,0,0.25)' }}
          >
            Читать →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Insider() {
  const { news } = useLiveData()
  const [cat, setCat] = useState('Все')
  const [searchQ, setSearchQ] = useState('')

  const filtered = news.filter((n) => {
    if (cat !== 'Все' && n.category !== cat) return false
    if (searchQ && !n.title.toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  })

  const hotCount = news.filter((n) => n.hot).length

  return (
    <div className="page-content">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-4"
        style={{ ...HEADER_BANNER_STYLE, borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-end justify-between">
          <div className="max-w-[50%]">
            <p className="text-[10px] font-black tracking-widest mb-1 uppercase" style={{ color: 'rgba(255,255,255,0.75)' }}>ЧМ 2026</p>
            <h1 className="text-2xl font-black uppercase tracking-wide" style={{ color: '#FFFFFF' }}>Инсайды</h1>
            <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.75)' }}>Новости и аналитика</p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 16 }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse2" style={{ background: '#DC2626' }} />
            <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: '#DC2626' }}>{hotCount} горячих</span>
          </div>
        </div>

        {/* Search */}
        <div
          className="mt-4 flex items-center gap-2 px-3 py-2.5"
          style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 16 }}
        >
          <span style={{ color: '#9CA3AF' }}>🔍</span>
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Поиск новостей..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#111827' }}
          />
          {searchQ && (
            <button onClick={() => setSearchQ('')} className="text-sm" style={{ color: '#9CA3AF' }}>✕</button>
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
              className="flex-shrink-0 px-3 py-1.5 text-xs font-black transition-all duration-200 uppercase tracking-wide"
              style={{
                background: cat === c ? '#DC2626' : 'rgba(0,0,0,0.05)',
                color: cat === c ? '#FFFFFF' : '#6B7280',
                borderRadius: 16,
                border: cat === c ? 'none' : '1px solid rgba(0,0,0,0.08)',
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
          <div className="text-center py-12 text-sm uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Ничего не найдено</div>
        ) : (
          filtered.map((n, i) => (
            <NewsCard key={n.id} news={n} featured={i === 0 && cat === 'Все' && !searchQ} />
          ))
        )}
      </div>
    </div>
  )
}
