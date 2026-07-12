import React, { useState } from 'react'
import { useStore, useDispatch, useNavigate } from '../hooks/useStore.jsx'
import { useMember, switchMember } from '../hooks/useMember.js'
import CounterCard from '../components/CounterCard.jsx'
import MemberAvatar from '../components/MemberAvatar.jsx'
import UndoToast from '../components/UndoToast.jsx'
import { getChampion, getDonkey, getStreaks, rankMedal } from '../lib/gamification.js'

// Shown when the app is opened without a valid identity — no personal link,
// or a link pointing at a member that doesn't exist
function WhoAreYou({ members, dispatch }) {
  const [choice, setChoice] = useState('')
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
      <div className="text-5xl">🕵️</div>
      <h2 className="text-xl font-extrabold" style={{ color: 'var(--c-text)' }}>¿Y tú quién eres?</h2>
      <p className="text-sm max-w-[260px]" style={{ color: 'var(--c-text-muted)' }}>
        Sin acusar a nadie, pero aquí los helados no se apuntan solos.
      </p>
      <select
        value={choice}
        onChange={e => setChoice(e.target.value)}
        className="w-full max-w-[260px] rounded-2xl px-4 py-3 text-base font-bold outline-none"
        style={{ background: 'var(--c-surface)', color: 'var(--c-text)', border: '1.5px solid var(--c-border)' }}
      >
        <option value="">Elige tu nombre…</option>
        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <button
        disabled={!choice}
        onClick={() => switchMember(dispatch, choice)}
        className="w-full max-w-[260px] px-6 py-3 rounded-2xl font-bold text-base disabled:opacity-40 active:opacity-80 transition-opacity"
        style={{ background: 'var(--c-brand)', color: '#fff' }}
      >
        Ese soy yo ✓
      </button>
      <p className="text-[11px]" style={{ color: 'var(--c-text-muted)' }}>
        Se recuerda en este dispositivo. Nada de suplantar al campeón.
      </p>
    </div>
  )
}

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

  function openStats(id) {
    dispatch({ type: 'SET_STATS_MEMBER', id })
    navigate('stats')
  }

  // No sessions yet
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <div className="text-5xl">🏖️</div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--c-text)' }}>Aún no hay sesiones</h2>
        {adminUnlocked ? (
          <>
            <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>Crea una sesión para empezar a llevar la cuenta (y las cuentas).</p>
            <button
              onClick={() => dispatch({ type: 'SET_SESSION_SWITCHER', open: true })}
              className="px-6 py-3 rounded-2xl font-bold text-base active:opacity-80 transition-opacity"
              style={{ background: 'var(--c-brand)', color: '#fff' }}
            >
              + Crear sesión
            </button>
          </>
        ) : (
          <>
            <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>Ve a Ajustes para desbloquear el modo admin y luego crea una sesión.</p>
            <button
              onClick={() => navigate('settings')}
              className="px-6 py-3 rounded-2xl font-bold text-base active:opacity-80"
              style={{ background: 'var(--c-surface-2)', color: 'var(--c-text)' }}
            >
              ⚙️ Ajustes
            </button>
          </>
        )}
      </div>
    )
  }

  if (!memberId) {
    // Members exist → ask who you are; otherwise nothing to pick from yet
    if (members.length > 0) {
      return <WhoAreYou members={members} dispatch={dispatch} />
    }
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <div className="text-5xl">🏖️</div>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--c-text)' }}>Counter Ops</h1>
        <p style={{ color: 'var(--c-text-muted)' }}>Aún no hay miembros. Pídele al admin que monte el equipo.</p>
      </div>
    )
  }

  const ranking = [...members]
    .map(m => ({
      ...m,
      total: entries.filter(e => e.member === m.id).reduce((s, e) => s + (e.qty || 1), 0),
    }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="pb-6" style={{ background: 'var(--c-bg)' }}>
      {/* Member scoreboard */}
      {members.length > 0 && (
        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <h2
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--c-text-muted)' }}
          >
            Marcador
          </h2>
          <p className="text-[11px] italic mb-3 mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
            {champion && donkey
              ? `👑 ${members.find(m => m.id === champion.memberId)?.name ?? '?'} manda hoy · 🐴 ${members.find(m => m.id === donkey.memberId)?.name ?? '?'} ya sabe lo que hay`
              : 'Aquí nadie compite. Ja.'}
          </p>
          <div className="flex flex-col gap-2">
            {ranking.map((m, i) => {
              const medal = rankMedal(i, ranking.length, m.total, m.id, champion?.memberId, donkey?.memberId)
              const streak = streaks[m.id]
              const isLead = i === 0 && m.total > 0
              return (
                <button
                  key={m.id}
                  onClick={() => openStats(m.id)}
                  className="flex items-center gap-3 px-3 py-2 rounded-2xl text-left active:opacity-70 transition-opacity w-full"
                  style={{
                    background: isLead ? 'rgba(232,97,58,0.08)' : 'var(--c-surface)',
                    border: isLead ? '1.5px solid rgba(232,97,58,0.25)' : '1px solid var(--c-border)',
                  }}
                >
                  <MemberAvatar member={m} memberId={m.id} size="md" showBadges={false} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold truncate" style={{ color: 'var(--c-text)' }}>
                      {m.name}{medal ? ` ${medal}` : ''}
                    </div>
                    {streak && (
                      <div className="text-[10px] text-orange-500">🔥 racha de {streak.days} días</div>
                    )}
                  </div>
                  <span
                    className="text-xl font-black leading-none"
                    style={{ color: isLead ? 'var(--c-brand)' : 'var(--c-text)' }}
                  >
                    {m.total}
                  </span>
                  <span className="text-base" style={{ color: 'var(--c-text-muted)' }}>›</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Counters grid */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>
            Apuntar rápido
          </h2>
          <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Toca para +1 · el ranking nunca olvida</span>
        </div>

        {counters.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--c-text-muted)' }}>
            <div className="text-4xl mb-2">🧮</div>
            <p className="text-sm">Aún no hay contadores. Dile al admin que espabile.</p>
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
