import React from 'react'
import { useStore, useDispatch, useNavigate } from '../hooks/useStore.jsx'
import { useMember } from '../hooks/useMember.js'
import CounterCard from '../components/CounterCard.jsx'
import MemberAvatar from '../components/MemberAvatar.jsx'
import UndoToast from '../components/UndoToast.jsx'
import { getChampion, getDonkey, getStreaks } from '../lib/gamification.js'

export default function HomeScreen() {
  const { counters, members, entries } = useStore()
  const { memberId } = useMember()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const champion = getChampion(entries)
  const donkey = getDonkey(entries, members)
  const streaks = getStreaks(entries)

  const activeCounters = counters

  function handleQuickAdd(counterId) {
    dispatch({ type: 'ADD_ENTRY', memberId, counterId, qty: 1 })
    window.dispatchEvent(new CustomEvent('counter-ops:sync'))
  }

  if (!memberId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <div className="text-5xl">🏖️</div>
        <h1 className="text-2xl font-bold text-slate-100">Counter Ops</h1>
        <p className="text-slate-400">Open your personal link to get started, or ask the admin for one.</p>
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Member scoreboard */}
      {members.length > 0 && (
        <div className="px-4 py-4 border-b border-slate-700">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Scoreboard</h2>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {members.map(m => {
              const total = entries.filter(e => e.member === m.id).reduce((s, e) => s + (e.qty || 1), 0)
              const isChampion = champion?.memberId === m.id
              const isDonkey = donkey?.memberId === m.id
              const streak = streaks[m.id]
              return (
                <div key={m.id} className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="relative">
                    <MemberAvatar member={m} memberId={m.id} size="lg" showBadges />
                    {isChampion && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-base leading-none">👑</span>}
                    {isDonkey && !isChampion && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm leading-none">🐴</span>}
                  </div>
                  <span className="text-xs text-slate-300 font-medium">{m.name}</span>
                  <span className="text-lg font-bold text-slate-100">{total}</span>
                  {streak && (
                    <span className="text-[10px] text-orange-400">🔥 {streak.days}d {streak.counter}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Counters */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Add</h2>
          <span className="text-xs text-slate-500">Tap to +1</span>
        </div>
        {activeCounters.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <div className="text-4xl mb-2">🧮</div>
            <p className="text-sm">No counters yet. Ask the admin to add some.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {activeCounters.map(c => (
              <CounterCard key={c.id} counter={c} onQuickAdd={handleQuickAdd} />
            ))}
          </div>
        )}
      </div>

      <UndoToast />
    </div>
  )
}
