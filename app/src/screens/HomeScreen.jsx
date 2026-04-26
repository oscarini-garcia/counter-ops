import React from 'react'
import { useStore, useDispatch, useNavigate } from '../hooks/useStore.jsx'
import { useMember } from '../hooks/useMember.js'
import CounterCard from '../components/CounterCard.jsx'
import MemberAvatar from '../components/MemberAvatar.jsx'
import UndoToast from '../components/UndoToast.jsx'
import { getChampion, getDonkey, getStreaks } from '../lib/gamification.js'

export default function HomeScreen() {
  const { counters, members, entries, sessions, adminUnlocked } = useStore()
  const { memberId } = useMember()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const champion = getChampion(entries)
  const donkey = getDonkey(entries, members)
  const streaks = getStreaks(entries)

  function handleQuickAdd(counterId) {
    dispatch({ type: 'ADD_ENTRY', memberId, counterId, qty: 1 })
    window.dispatchEvent(new CustomEvent('counter-ops:sync'))
  }

  // No sessions yet
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <div className="text-5xl">🏖️</div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--c-text)' }}>No sessions yet</h2>
        {adminUnlocked ? (
          <>
            <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>Create a session to start tracking.</p>
            <button
              onClick={() => dispatch({ type: 'SET_SESSION_SWITCHER', open: true })}
              className="px-6 py-3 rounded-2xl font-bold text-base active:opacity-80 transition-opacity"
              style={{ background: 'var(--c-brand)', color: '#fff' }}
            >
              + Create session
            </button>
          </>
        ) : (
          <>
            <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>Go to Settings to unlock admin, then create a session.</p>
            <button
              onClick={() => navigate('settings')}
              className="px-6 py-3 rounded-2xl font-bold text-base active:opacity-80"
              style={{ background: 'var(--c-surface-2)', color: 'var(--c-text)' }}
            >
              ⚙️ Settings
            </button>
          </>
        )}
      </div>
    )
  }

  if (!memberId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <div className="text-5xl">🏖️</div>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--c-text)' }}>Counter Ops</h1>
        <p style={{ color: 'var(--c-text-muted)' }}>Open your personal link to get started, or ask the admin for one.</p>
      </div>
    )
  }

  return (
    <div className="pb-6" style={{ background: 'var(--c-bg)' }}>
      {/* Member scoreboard */}
      {members.length > 0 && (
        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: 'var(--c-text-muted)' }}
          >
            Scoreboard
          </h2>
          <div className="flex gap-5 overflow-x-auto pb-1">
            {[...members]
              .map(m => ({
                ...m,
                total: entries.filter(e => e.member === m.id).reduce((s, e) => s + (e.qty || 1), 0),
              }))
              .sort((a, b) => b.total - a.total)
              .map(m => {
                const isChampion = champion?.memberId === m.id
                const isDonkey   = donkey?.memberId   === m.id
                const streak     = streaks[m.id]
                return (
                  <div key={m.id} className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="relative">
                      <MemberAvatar member={m} memberId={m.id} size="lg" showBadges />
                      {isChampion && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-base leading-none">👑</span>
                      )}
                      {isDonkey && !isChampion && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm leading-none">🐴</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--c-text)' }}>{m.name}</span>
                    <span
                      className="text-xl font-black leading-none"
                      style={{ color: isChampion ? 'var(--c-brand)' : 'var(--c-text)' }}
                    >
                      {m.total}
                    </span>
                    {streak && (
                      <span className="text-[10px] text-orange-500">🔥 {streak.days}d</span>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Counters grid */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>
            Quick Add
          </h2>
          <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Tap to +1</span>
        </div>

        {counters.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--c-text-muted)' }}>
            <div className="text-4xl mb-2">🧮</div>
            <p className="text-sm">No counters yet. Ask the admin to add some.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {counters.map(c => (
              <CounterCard key={c.id} counter={c} onQuickAdd={handleQuickAdd} />
            ))}
          </div>
        )}
      </div>

      <UndoToast />
    </div>
  )
}
