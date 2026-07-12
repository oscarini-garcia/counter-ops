import React from 'react'
import { useStore, useDispatch } from '../hooks/useStore.jsx'
import { useMember } from '../hooks/useMember.js'
import MemberAvatar from '../components/MemberAvatar.jsx'
import MemberDailyChart from '../components/MemberDailyChart.jsx'
import { getChampion, getDonkey, getStreaks, rankQuip, rankMedal } from '../lib/gamification.js'

const qty = e => e.qty || 1

// Seeded picks: stable while you look at the screen (person + day),
// different tomorrow and different for your sister
function hashSeed(str) {
  let h = 0
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}
const pick = (seed, arr) => arr[hashSeed(seed) % arr.length]

function seededShuffle(seed, arr) {
  const a = [...arr]
  let h = hashSeed(seed)
  for (let i = a.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0
    const j = h % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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

  // ── Insights: every category has alternative punchlines, picked with a
  // person+day seed, then the whole list is seeded-shuffled and capped ──
  const daySeed = `${selectedId}|${new Date().toDateString()}`
  const insights = []

  if (total > 0) {
    if (breakdown[0]) {
      const pct = Math.round((breakdown[0].n / total) * 100)
      const ending = pick(daySeed + 'debilidad', [
        'Un patrón, no una casualidad.',
        'El corazón tiene razones que la nevera no entiende.',
        'En su testamento pedirá esto, seguro.',
        'La ciencia lo llama «preferencia revelada». La familia, vicio.',
      ])
      insights.push({
        icon: '💡',
        text: <>Debilidad confesa: <b>{breakdown[0].counter.emoji} {breakdown[0].counter.label}</b> — el {pct}% de todo lo que apunta. <em>{ending}</em></>,
      })
    }

    const locCounts = {}
    for (const e of mine) if (e.location?.label) locCounts[e.location.label] = (locCounts[e.location.label] || 0) + 1
    const topLoc = Object.entries(locCounts).sort((a, b) => b[1] - a[1])[0]
    if (topLoc) {
      const ending = topLoc[1] >= 3
        ? pick(daySeed + 'lugar', ['Ya le guardan sitio.', 'Debería pagar alquiler allí.', 'El camarero ya ni pregunta.'])
        : pick(daySeed + 'lugar', ['De momento, coartada creíble.', 'Todavía disimula.'])
      insights.push({
        icon: '📍',
        text: <>Lugar favorito: <b>{topLoc[0]}</b> ({topLoc[1]} {topLoc[1] === 1 ? 'visita' : 'visitas'}). <em>{ending}</em></>,
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
      const quips = h < 12
        ? ['Empezar fuerte es una filosofía de vida.', 'El desayuno de los campeones.']
        : h < 16
          ? ['La sobremesa es su hábitat natural.', 'Justo cuando la familia baja la guardia.']
          : h < 20
            ? ['La merienda es sagrada.', 'A esa hora, religiosamente.']
            : ['Criatura nocturna. Respetable.', 'Cuando nadie mira. Craso error: la app siempre mira.']
      insights.push({
        icon: '⏰',
        text: <>Hora punta: <b>{String(h).padStart(2, '0')}:00–{String((h + 1) % 24).padStart(2, '0')}:00</b>. <em>{pick(daySeed + 'hora', quips)}</em></>,
      })
    }

    const activeTotals = ranking.filter(r => r.total > 0)
    if (activeTotals.length >= 2) {
      const familyAvg = activeTotals.reduce((s, r) => s + r.total, 0) / activeTotals.length
      const diff = Math.round(((total - familyAvg) / familyAvg) * 100)
      const ending = diff > 25
        ? pick(daySeed + 'media', ['Liderazgo con autoridad.', 'Tirando del carro. Literalmente.'])
        : diff >= 0
          ? pick(daySeed + 'media', ['Por encima de la media, como en el colegio.', 'Cumplidor, sin escándalos.'])
          : pick(daySeed + 'media', ['Contención admirable. O mala suerte.', 'Alguien tiene que bajar la media.'])
      insights.push({
        icon: '📈',
        text: diff >= 0
          ? <>Un <b>{diff}% por encima</b> de la media familiar. <em>{ending}</em></>
          : <>Un <b>{Math.abs(diff)}% por debajo</b> de la media familiar. <em>{ending}</em></>,
      })
    }

    const rated = mine.filter(e => e.rating)
    if (rated.length >= 2) {
      const avg = rated.reduce((s, e) => s + e.rating, 0) / rated.length
      const ending = avg >= 4
        ? pick(daySeed + 'rating', ['Aquí se disfruta con criterio.', 'Paladar fino, libreta implacable.'])
        : pick(daySeed + 'rating', ['Exigente. O gafe con los sitios.', 'Difícil de impresionar.'])
      insights.push({
        icon: '⭐',
        text: <>Valoración media: <b>{avg.toFixed(1).replace('.', ',')} / 5</b>. <em>{ending}</em></>,
      })
    }

    // 🎲 Useless stat of the day
    if (activeDays >= 1) {
      const top = breakdown[0]?.counter
      const variants = [
        <>A este ritmo: <b>{Math.round(avgPerDay * 365)} al año</b>. <em>Nadie lo ha pedido. De nada.</em></>,
        <>Eso son <b>{(total * 0.15).toFixed(1).replace('.', ',')} kg de felicidad</b>, según un estudio inventado ahora mismo. <em>Cálculo no auditado.</em></>,
        top ? <>Puestos en fila, sus {total} {top.label} son <b>un argumento sólido</b> para repetir vacaciones. <em>La lógica es impecable.</em></> : null,
      ].filter(Boolean)
      insights.push({ icon: '🎲', text: pick(daySeed + 'inutil', variants) })
    }

    // 📅 Weekend vs weekdays
    const wk = { we: 0, weDays: new Set(), wd: 0, wdDays: new Set() }
    for (const e of mine) {
      const d = new Date(e.timestamp)
      const isWe = d.getDay() === 0 || d.getDay() === 6
      if (isWe) { wk.we += qty(e); wk.weDays.add(d.toDateString()) }
      else { wk.wd += qty(e); wk.wdDays.add(d.toDateString()) }
    }
    if (wk.weDays.size >= 1 && wk.wdDays.size >= 2 && total >= 5) {
      const weAvg = wk.we / wk.weDays.size
      const wdAvg = wk.wd / wk.wdDays.size
      if (weAvg > wdAvg * 1.2) {
        insights.push({
          icon: '📅',
          text: <>Los <b>fines de semana</b> consume un {Math.round((weAvg / wdAvg - 1) * 100)}% más. <em>{pick(daySeed + 'finde', ['El descanso también se entrena.', 'El sábado no cuenta. (Sí cuenta.)'])}</em></>,
        })
      } else if (wdAvg > weAvg * 1.2) {
        insights.push({
          icon: '📅',
          text: <>Entre semana aprieta un {Math.round((wdAvg / weAvg - 1) * 100)}% más que el finde. <em>{pick(daySeed + 'finde', ['Contracorriente, como los grandes.', 'El lunes se lleva mejor con ayuda.'])}</em></>,
        })
      }
    }

    // ⚖️ Today vs yesterday
    const todayKey = new Date().toDateString()
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    const todayN = byDay[todayKey] ?? 0
    const yestN = byDay[yesterday.toDateString()] ?? 0
    if (todayN > 0 || yestN > 0) {
      const text = todayN > yestN
        ? <>Hoy lleva <b>{todayN}</b> y ayer cerró con {yestN}. <em>{pick(daySeed + 'ayer', ['Va camino de superarse. Preocupante y admirable.', 'La progresión es innegable.'])}</em></>
        : todayN === yestN && todayN > 0
          ? <>Hoy va <b>empatado con ayer</b> ({todayN}). <em>Consistencia de metrónomo.</em></>
          : <>Hoy lleva <b>{todayN}</b> frente a los {yestN} de ayer. <em>{pick(daySeed + 'ayer', ['Contención sospechosa. ¿Está bien?', 'Aún hay tarde por delante.'])}</em></>
      insights.push({ icon: '⚖️', text })
    }

    // 🤝 Direct rival
    if (rankIndex > 0) {
      const above = ranking[rankIndex - 1]
      const gap = above.total - total
      if (gap > 0) {
        insights.push({
          icon: '🤝',
          text: <>A <b>{gap}</b> de destronar a <b>{above.member.name}</b>. <em>{pick(daySeed + 'rival', ['Se puede. Se debe.', 'La remontada se sirve fría.', 'Todo es cuestión de merendar dos veces.'])}</em></>,
        })
      }
    } else if (ranking.length >= 2 && ranking[1].total > 0) {
      const margin = total - ranking[1].total
      insights.push({
        icon: '🤝',
        text: margin <= 2
          ? <><b>{ranking[1].member.name}</b> está a solo {margin === 0 ? 'nada' : margin}. <em>Que no se duerma en los laureles.</em></>
          : <>Ventaja de <b>{margin}</b> sobre {ranking[1].member.name}. <em>{pick(daySeed + 'rival', ['Ya compite contra sí mismo.', 'El trono está cómodo, dicen.'])}</em></>,
      })
    }

    // 🌅 Mornings vs afternoons
    const before = mine.filter(e => new Date(e.timestamp).getHours() < 15).reduce((s, e) => s + qty(e), 0)
    if (total >= 4) {
      const pctBefore = Math.round((before / total) * 100)
      if (pctBefore >= 70) {
        insights.push({ icon: '🌅', text: <>El <b>{pctBefore}%</b> cae antes de las 15:00. <em>{pick(daySeed + 'am', ['A quien madruga…', 'Las tardes son para la siesta, claro.'])}</em></> })
      } else if (pctBefore <= 30) {
        insights.push({ icon: '🌇', text: <>El <b>{100 - pctBefore}%</b> cae después de las 15:00. <em>{pick(daySeed + 'pm', ['El sol de tarde da sed. Y hambre.', 'La siesta abre el apetito. Científicamente.'])}</em></> })
      }
    }
  }

  // Rotate: seeded shuffle, cap at 4 so two visits rarely read the same
  const shownInsights = seededShuffle(daySeed + 'orden', insights).slice(0, 4)

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

          {/* Day-by-day stacked chart */}
          <div>
            <div style={sectionLabel}>Día a día — qué ha ido cayendo</div>
            <div className="rounded-2xl p-3" style={tileStyle}>
              <MemberDailyChart entries={mine} counters={counters} />
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
          {shownInsights.length > 0 && (
            <div>
              <div style={sectionLabel}>Insights (con todo el cariño)</div>
              <div className="flex flex-col gap-2">
                {shownInsights.map((ins, i) => (
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
