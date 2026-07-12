import React from 'react'
import { useStore, useDispatch } from '../hooks/useStore.jsx'
import { useMember } from '../hooks/useMember.js'
import MemberAvatar from '../components/MemberAvatar.jsx'
import { getChampion, getDonkey, getStreaks, rankQuip, rankMedal } from '../lib/gamification.js'

const qty = e => e.qty || 1

export default function StatsScreen() {
  const { entries, members, counters, statsMember } = useStore()
  const { memberId } = useMember()
  const dispatch = useDispatch()

  // Ranking by overall total — shared context for position, medal and quip
  const ranking = members
    .map(m => ({ member: m, total: entries.filter(e => e.member === m.id).reduce((s, e) => s + qty(e), 0) }))
    .sort((a, b) => b.total - a.total)

  const selectedId = [statsMember, memberId, ranking[0]?.member.id].find(
    id => id && members.some(m => m.id === id)
  ) ?? ''
  const selected = members.find(m => m.id === selectedId) ?? null

  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <div className="text-5xl">📊</div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--c-text)' }}>Sin gente que analizar</h2>
        <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>Cuando el admin añada miembros, aquí se les hará la autopsia estadística.</p>
      </div>
    )
  }

  const mine = entries.filter(e => e.member === selectedId)
  const total = mine.reduce((s, e) => s + qty(e), 0)
  const rankIndex = ranking.findIndex(r => r.member.id === selectedId)

  const champion = getChampion(entries)
  const donkey = getDonkey(entries, members)
  const medal = rankMedal(rankIndex, ranking.length, total, selectedId, champion?.memberId, donkey?.memberId)
  const streak = getStreaks(entries)[selectedId]

  // Per-day totals → daily average and record day
  const byDay = {}
  for (const e of mine) {
    const day = new Date(e.timestamp).toDateString()
    byDay[day] = (byDay[day] || 0) + qty(e)
  }
  const activeDays = Object.keys(byDay).length
  const avgPerDay = activeDays ? total / activeDays : 0
  const recordDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0] ?? null

  // Breakdown per counter
  const breakdown = counters
    .map(c => ({ counter: c, n: mine.filter(e => e.counter === c.id).reduce((s, e) => s + qty(e), 0) }))
    .filter(b => b.n > 0)
    .sort((a, b) => b.n - a.n)
  const maxN = breakdown[0]?.n ?? 1

  // Insights
  const insights = []

  if (breakdown[0]) {
    const pct = Math.round((breakdown[0].n / total) * 100)
    insights.push({
      icon: '💡',
      text: <>Debilidad confesa: <b>{breakdown[0].counter.emoji} {breakdown[0].counter.label}</b> — el {pct}% de todo lo que apunta. <em>Un patrón, no una casualidad.</em></>,
    })
  }

  const locCounts = {}
  for (const e of mine) if (e.location?.label) locCounts[e.location.label] = (locCounts[e.location.label] || 0) + 1
  const topLoc = Object.entries(locCounts).sort((a, b) => b[1] - a[1])[0]
  if (topLoc) {
    insights.push({
      icon: '📍',
      text: <>Lugar favorito: <b>{topLoc[0]}</b> ({topLoc[1]} {topLoc[1] === 1 ? 'visita' : 'visitas'}). <em>{topLoc[1] >= 3 ? 'Ya le guardan sitio.' : 'De momento, coartada creíble.'}</em></>,
    })
  }

  const hourCounts = {}
  for (const e of mine) {
    const h = new Date(e.timestamp).getHours()
    hourCounts[h] = (hourCounts[h] || 0) + qty(e)
  }
  const topHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]
  if (topHour && mine.length >= 3) {
    const h = Number(topHour[0])
    const quip = h < 12 ? 'Empezar fuerte es una filosofía de vida.'
      : h < 16 ? 'La sobremesa es su hábitat natural.'
      : h < 20 ? 'La merienda es sagrada.'
      : 'Criatura nocturna. Respetable.'
    insights.push({
      icon: '⏰',
      text: <>Hora punta: <b>{String(h).padStart(2, '0')}:00–{String((h + 1) % 24).padStart(2, '0')}:00</b>. <em>{quip}</em></>,
    })
  }

  const activeTotals = ranking.filter(r => r.total > 0)
  if (activeTotals.length >= 2 && total > 0) {
    const familyAvg = activeTotals.reduce((s, r) => s + r.total, 0) / activeTotals.length
    const diff = Math.round(((total - familyAvg) / familyAvg) * 100)
    insights.push({
      icon: '📈',
      text: diff >= 0
        ? <>Un <b>{diff}% por encima</b> de la media familiar. <em>{diff > 25 ? 'Liderazgo con autoridad.' : 'Por encima de la media, como en el colegio.'}</em></>
        : <>Un <b>{Math.abs(diff)}% por debajo</b> de la media familiar. <em>Contención admirable. O mala suerte.</em></>,
    })
  }

  const rated = mine.filter(e => e.rating)
  if (rated.length >= 2) {
    const avg = rated.reduce((s, e) => s + e.rating, 0) / rated.length
    insights.push({
      icon: '⭐',
      text: <>Valoración media: <b>{avg.toFixed(1).replace('.', ',')} / 5</b>. <em>{avg >= 4 ? 'Aquí se disfruta con criterio.' : 'Exigente. O gafe con los sitios.'}</em></>,
    })
  }

  const sectionLabel = {
    fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
    color: 'var(--c-text-muted)', marginBottom: 10,
  }
  const tileStyle = { background: 'var(--c-surface)', border: '1px solid var(--c-border)' }

  return (
    <div className="px-4 py-5 flex flex-col gap-5 max-w-lg mx-auto pb-8" style={{ background: 'var(--c-bg)' }}>

      {/* Header + member selector */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-black" style={{ color: 'var(--c-text)' }}>Estadísticas</h1>
        <select
          value={selectedId}
          onChange={e => dispatch({ type: 'SET_STATS_MEMBER', id: e.target.value })}
          className="text-sm font-bold rounded-full px-3 py-1.5 outline-none"
          style={{ background: 'var(--c-surface)', color: 'var(--c-text)', border: '1.5px solid var(--c-border)' }}
        >
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Rank hero card */}
      <div
        className="rounded-2xl p-4 flex items-center gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(232,97,58,0.12) 0%, var(--c-surface) 100%)',
          border: '1.5px solid rgba(232,97,58,0.25)',
        }}
      >
        <MemberAvatar member={selected} memberId={selectedId} size="lg" showBadges={false} />
        <div className="min-w-0">
          <div className="text-lg font-black" style={{ color: 'var(--c-text)' }}>
            {selected.name}{medal ? ` ${medal}` : ''}
          </div>
          <div className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
            <b style={{ color: 'var(--c-brand)' }}>{rankIndex + 1}º de {ranking.length}</b> en el ranking — {rankQuip(rankIndex, ranking.length, total)}
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div className="text-center py-10 px-4" style={{ color: 'var(--c-text-muted)' }}>
          <div className="text-4xl mb-2">🧘</div>
          <p className="text-sm">Ni una sola entrada. O santidad absoluta o falta de cobertura.</p>
        </div>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl px-3.5 py-3" style={tileStyle}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>Total apuntado</div>
              <div className="text-2xl font-black" style={{ color: 'var(--c-text)' }}>{total}</div>
            </div>
            <div className="rounded-2xl px-3.5 py-3" style={tileStyle}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>Media diaria</div>
              <div className="text-2xl font-black" style={{ color: 'var(--c-text)' }}>
                {avgPerDay.toFixed(1).replace('.', ',')}<span className="text-xs font-bold" style={{ color: 'var(--c-text-muted)' }}> /día</span>
              </div>
            </div>
            <div className="rounded-2xl px-3.5 py-3" style={tileStyle}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>Racha</div>
              <div className="text-2xl font-black" style={{ color: 'var(--c-text)' }}>
                {streak ? <>🔥 {streak.days}<span className="text-xs font-bold" style={{ color: 'var(--c-text-muted)' }}> días</span></> : '—'}
              </div>
            </div>
            <div className="rounded-2xl px-3.5 py-3" style={tileStyle}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>Día récord</div>
              <div className="text-2xl font-black" style={{ color: 'var(--c-text)' }}>
                {recordDay ? <>{recordDay[1]}<span className="text-xs font-bold" style={{ color: 'var(--c-text-muted)' }}> · {new Date(recordDay[0]).toLocaleDateString([], { day: 'numeric', month: 'short' })}</span></> : '—'}
              </div>
            </div>
          </div>

          {/* Breakdown per counter */}
          <div>
            <div style={sectionLabel}>Qué ha consumido</div>
            <div className="flex flex-col gap-2">
              {breakdown.map(({ counter, n }) => (
                <div key={counter.id} className="grid items-center gap-2" style={{ gridTemplateColumns: '96px 1fr 34px' }}>
                  <span className="text-xs font-bold truncate" style={{ color: 'var(--c-text)' }}>{counter.emoji} {counter.label}</span>
                  <div className="h-3.5 rounded-full overflow-hidden" style={{ background: 'var(--c-surface-2)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(n / maxN) * 100}%`, background: 'var(--c-brand)' }} />
                  </div>
                  <span className="text-sm font-black text-right" style={{ color: 'var(--c-text)' }}>{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div>
              <div style={sectionLabel}>Insights (con todo el cariño)</div>
              <div className="flex flex-col gap-2">
                {insights.map((ins, i) => (
                  <div key={i} className="flex gap-2.5 rounded-2xl px-3 py-2.5 text-sm" style={tileStyle}>
                    <span>{ins.icon}</span>
                    <span style={{ color: 'var(--c-text)' }}>{ins.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
