import React, { lazy, Suspense, useState } from 'react'
import { useStore } from '../hooks/useStore.jsx'
import { useMember } from '../hooks/useMember.js'
import MemberAvatar from '../components/MemberAvatar.jsx'
import { generateAwards } from '../lib/awards.js'

const LeafletMap = lazy(() => import('../components/LeafletMap.jsx'))
const TimelineChart = lazy(() => import('../components/TimelineChart.jsx'))

export default function ReportScreen() {
  const { entries, members, counters, session } = useStore()
  const { memberId } = useMember()
  const [personalOnly, setPersonalOnly] = useState(false)
  const [leaderboardCounter, setLeaderboardCounter] = useState('')

  const viewEntries = personalOnly ? entries.filter(e => e.member === memberId) : entries

  // Leaderboard
  const totalsPerMember = members.map(m => {
    const total = viewEntries.filter(e => e.member === m.id && (!leaderboardCounter || e.counter === leaderboardCounter))
      .reduce((s, e) => s + (e.qty || 1), 0)
    return { member: m, total }
  }).sort((a, b) => b.total - a.total)

  // Trip summary stats
  const totalEntries = entries.length
  const datesSorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const startDate = datesSorted[0]?.timestamp ? new Date(datesSorted[0].timestamp).toLocaleDateString([], { day: 'numeric', month: 'short' }) : '—'
  const endDate = datesSorted[datesSorted.length - 1]?.timestamp ? new Date(datesSorted[datesSorted.length - 1].timestamp).toLocaleDateString([], { day: 'numeric', month: 'short' }) : '—'

  const topLocation = (() => {
    const counts = {}
    for (const e of entries) if (e.location?.label) counts[e.location.label] = (counts[e.location.label] || 0) + 1
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  })()

  const counterTotals = counters.map(c => ({
    counter: c,
    total: entries.filter(e => e.counter === c.id).reduce((s, e) => s + (e.qty || 1), 0)
  })).sort((a, b) => b.total - a.total)

  const funStat = counterTotals[0]
    ? `The family had ${counterTotals[0].total} ${counterTotals[0].counter.label}${counterTotals[0].total !== 1 ? 's' : ''}. No regrets.`
    : null

  const awards = generateAwards(entries, members)

  return (
    <div className="px-4 py-4 flex flex-col gap-6 max-w-lg mx-auto pb-8">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-100">Trip Report</h1>
        {memberId && (
          <button
            onClick={() => setPersonalOnly(p => !p)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${personalOnly ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            {personalOnly ? 'My stats' : 'Family'}
          </button>
        )}
      </div>

      {/* Leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300">Leaderboard</h2>
          <select
            value={leaderboardCounter}
            onChange={e => setLeaderboardCounter(e.target.value)}
            className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none"
          >
            <option value="">All counters</option>
            {counters.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          {totalsPerMember.map(({ member, total }, i) => (
            <div key={member.id} className="flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2.5">
              <span className="text-slate-400 font-bold text-sm w-5 text-center">{i + 1}</span>
              <MemberAvatar member={member} memberId={member.id} size="sm" showBadges={false} />
              <span className="flex-1 text-slate-100 font-medium">{member.name}</span>
              <span className="text-xl font-bold text-indigo-400">{total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {entries.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Timeline</h2>
          <Suspense fallback={<div className="h-40 bg-slate-800 rounded-xl animate-pulse" />}>
            <TimelineChart entries={viewEntries} filterMember={personalOnly ? memberId : ''} />
          </Suspense>
        </div>
      )}

      {/* Map */}
      {entries.some(e => e.location?.lat) && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Map</h2>
          <Suspense fallback={<div className="h-72 bg-slate-800 rounded-xl animate-pulse" />}>
            <LeafletMap entries={viewEntries} counters={counters} />
          </Suspense>
        </div>
      )}

      {/* Trip Summary Card */}
      {totalEntries > 0 && (
        <div className="bg-gradient-to-br from-indigo-900/60 to-slate-800 rounded-2xl p-4 border border-indigo-700/40">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">📸 Trip Summary</h2>
          <div className="text-lg font-bold text-slate-100">{session}</div>
          <div className="text-xs text-slate-400 mt-0.5 mb-3">{startDate} – {endDate}</div>
          <div className="flex flex-col gap-1 mb-3">
            {counterTotals.filter(c => c.total > 0).map(({ counter, total }) => (
              <div key={counter.id} className="flex items-center gap-2 text-sm">
                <span>{counter.emoji}</span>
                <span className="text-slate-300">{counter.label}</span>
                <span className="ml-auto font-bold text-slate-100">{total}</span>
              </div>
            ))}
          </div>
          {topLocation && <div className="text-xs text-slate-400">📍 Favourite spot: {topLocation}</div>}
          {funStat && <div className="text-xs text-indigo-300 mt-1 italic">{funStat}</div>}
        </div>
      )}

      {/* Awards */}
      {awards.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">🏅 Awards</h2>
          <div className="flex flex-col gap-2">
            {awards.map((a, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2.5">
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-100">{a.title}</div>
                  <div className="text-xs text-slate-400">{a.winner} · {a.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared moments */}
      {entries.filter(e => e.note).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">💬 Moments</h2>
          <div className="flex flex-col gap-2">
            {entries.filter(e => e.note).slice(-10).reverse().map(e => {
              const counter = counters.find(c => c.id === e.counter)
              const member = members.find(m => m.id === e.member)
              return (
                <div key={e.id} className="bg-slate-800 rounded-xl px-3 py-2.5">
                  <div className="text-sm text-slate-100 italic">"{e.note}"</div>
                  <div className="text-xs text-slate-500 mt-0.5">{member?.name ?? e.member} · {counter?.emoji} {counter?.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
