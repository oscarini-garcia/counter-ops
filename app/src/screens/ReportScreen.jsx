import React, { lazy, Suspense, useState } from 'react'
import { useStore } from '../hooks/useStore.jsx'
import { useMember } from '../hooks/useMember.js'
import MemberAvatar from '../components/MemberAvatar.jsx'
import { generateAwards } from '../lib/awards.js'

const LeafletMap    = lazy(() => import('../components/LeafletMap.jsx'))
const TimelineChart = lazy(() => import('../components/TimelineChart.jsx'))

export default function ReportScreen() {
  const { entries, members, counters, session } = useStore()
  const { memberId } = useMember()
  const [personalOnly,       setPersonalOnly]       = useState(false)
  const [leaderboardCounter, setLeaderboardCounter] = useState('')

  const viewEntries = personalOnly ? entries.filter(e => e.member === memberId) : entries

  const totalsPerMember = members.map(m => ({
    member: m,
    total: viewEntries
      .filter(e => e.member === m.id && (!leaderboardCounter || e.counter === leaderboardCounter))
      .reduce((s, e) => s + (e.qty || 1), 0),
  })).sort((a, b) => b.total - a.total)

  const totalEntries = entries.length
  const datesSorted  = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const startDate    = datesSorted[0]?.timestamp
    ? new Date(datesSorted[0].timestamp).toLocaleDateString([], { day: 'numeric', month: 'short' }) : '—'
  const endDate      = datesSorted[datesSorted.length - 1]?.timestamp
    ? new Date(datesSorted[datesSorted.length - 1].timestamp).toLocaleDateString([], { day: 'numeric', month: 'short' }) : '—'

  const topLocation = (() => {
    const counts = {}
    for (const e of entries) if (e.location?.label) counts[e.location.label] = (counts[e.location.label] || 0) + 1
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  })()

  const counterTotals = counters.map(c => ({
    counter: c,
    total: entries.filter(e => e.counter === c.id).reduce((s, e) => s + (e.qty || 1), 0),
  })).sort((a, b) => b.total - a.total)

  const funStat = counterTotals[0]
    ? `The family had ${counterTotals[0].total} ${counterTotals[0].counter.label}${counterTotals[0].total !== 1 ? 's' : ''}. No regrets.`
    : null

  const awards = generateAwards(entries, members)

  const sectionLabel = {
    fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
    color: 'var(--c-text-muted)', marginBottom: 10,
  }

  return (
    <div className="px-4 py-5 flex flex-col gap-6 max-w-lg mx-auto pb-8" style={{ background: 'var(--c-bg)' }}>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black" style={{ color: 'var(--c-text)' }}>Trip Report</h1>
        {memberId && (
          <button
            onClick={() => setPersonalOnly(p => !p)}
            className="text-xs px-3 py-1.5 rounded-full font-bold transition-colors"
            style={personalOnly
              ? { background: 'var(--c-brand)', color: '#fff' }
              : { background: 'var(--c-surface-2)', color: 'var(--c-text-muted)', border: '1px solid var(--c-border)' }
            }
          >
            {personalOnly ? 'My stats' : 'Everyone'}
          </button>
        )}
      </div>

      {/* Leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div style={sectionLabel}>Leaderboard</div>
          <select
            value={leaderboardCounter}
            onChange={e => setLeaderboardCounter(e.target.value)}
            className="text-xs rounded-lg px-2 py-1 outline-none"
            style={{ background: 'var(--c-surface)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
          >
            <option value="">All counters</option>
            {counters.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          {totalsPerMember.map(({ member, total }, i) => (
            <div
              key={member.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
              style={{
                background: i === 0 ? 'rgba(232,97,58,0.08)' : 'var(--c-surface)',
                border: i === 0 ? '1.5px solid rgba(232,97,58,0.25)' : '1px solid var(--c-border)',
              }}
            >
              <span className="font-bold text-sm w-5 text-center" style={{ color: 'var(--c-text-muted)' }}>{i + 1}</span>
              <MemberAvatar member={member} memberId={member.id} size="sm" showBadges={false} />
              <span className="flex-1 font-semibold" style={{ color: 'var(--c-text)' }}>{member.name}</span>
              {i === 0 && <span>👑</span>}
              <span className="text-xl font-black" style={{ color: i === 0 ? 'var(--c-brand)' : 'var(--c-text)' }}>{total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {entries.length > 0 && (
        <div>
          <div style={sectionLabel}>Timeline</div>
          <Suspense fallback={<div className="h-40 rounded-xl animate-pulse" style={{ background: 'var(--c-surface)' }} />}>
            <TimelineChart entries={viewEntries} filterMember={personalOnly ? memberId : ''} />
          </Suspense>
        </div>
      )}

      {/* Map */}
      {entries.some(e => e.location?.lat) && (
        <div>
          <div style={sectionLabel}>Map</div>
          <Suspense fallback={<div className="h-72 rounded-xl animate-pulse" style={{ background: 'var(--c-surface)' }} />}>
            <LeafletMap entries={viewEntries} counters={counters} />
          </Suspense>
        </div>
      )}

      {/* Trip Summary Card */}
      {totalEntries > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(232,97,58,0.1) 0%, var(--c-surface) 100%)',
            border: '1.5px solid rgba(232,97,58,0.2)',
          }}
        >
          <div className="text-sm font-bold mb-1" style={{ color: 'var(--c-text-muted)' }}>📸 Trip Summary</div>
          <div className="text-lg font-black" style={{ color: 'var(--c-text)' }}>{session}</div>
          <div className="text-xs mb-3" style={{ color: 'var(--c-text-muted)' }}>{startDate} – {endDate}</div>
          <div className="flex flex-col gap-1.5 mb-3">
            {counterTotals.filter(c => c.total > 0).map(({ counter, total }) => (
              <div key={counter.id} className="flex items-center gap-2 text-sm">
                <span>{counter.emoji}</span>
                <span style={{ color: 'var(--c-text)' }}>{counter.label}</span>
                <span className="ml-auto font-black" style={{ color: 'var(--c-text)' }}>{total}</span>
              </div>
            ))}
          </div>
          {topLocation && <div className="text-xs" style={{ color: 'var(--c-text-muted)' }}>📍 Favourite spot: {topLocation}</div>}
          {funStat && <div className="text-xs mt-1 italic" style={{ color: 'var(--c-brand)' }}>{funStat}</div>}
        </div>
      )}

      {/* Awards */}
      {awards.length > 0 && (
        <div>
          <div style={sectionLabel}>🏅 Awards</div>
          <div className="flex flex-col gap-2">
            {awards.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
                style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
              >
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>{a.title}</div>
                  <div className="text-xs" style={{ color: 'var(--c-text-muted)' }}>{a.winner} · {a.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moments */}
      {entries.filter(e => e.note).length > 0 && (
        <div>
          <div style={sectionLabel}>💬 Moments</div>
          <div className="flex flex-col gap-2">
            {entries.filter(e => e.note).slice(-10).reverse().map(e => {
              const counter = counters.find(c => c.id === e.counter)
              const member  = members.find(m => m.id === e.member)
              return (
                <div
                  key={e.id}
                  className="px-3 py-2.5 rounded-2xl"
                  style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
                >
                  <div className="text-sm italic" style={{ color: 'var(--c-text)' }}>"{e.note}"</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                    {member?.name ?? e.member} · {counter?.emoji} {counter?.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
