import React from 'react'
import { useStore, useDispatch, useNavigate } from '../hooks/useStore.jsx'
import { useMember } from '../hooks/useMember.js'
import SyncBadge from './SyncBadge.jsx'
import MemberAvatar from './MemberAvatar.jsx'

const NAV = [
  { screen: 'home',    icon: '🏠', label: 'Home'    },
  { screen: 'log',     icon: '➕', label: 'Log'     },
  { screen: 'entries', icon: '📋', label: 'Entries' },
  { screen: 'report',  icon: '📊', label: 'Report'  },
]

export default function AppShell({ children }) {
  const { activeScreen, activeSession, sessions, adminUnlocked } = useStore()
  const dispatch = useDispatch()
  const { memberId, member } = useMember()
  const navigate = useNavigate()

  function openProfile() {
    window.dispatchEvent(new CustomEvent('counter-ops:open-profile'))
  }

  function openSwitcher() {
    dispatch({ type: 'SET_SESSION_SWITCHER', open: true })
  }

  return (
    <div className="flex flex-col h-full" style={{ paddingTop: 'var(--safe-top)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-700 flex-shrink-0 z-10">
        {/* Session name — tappable */}
        <button
          onClick={openSwitcher}
          className="flex items-center gap-1.5 text-left min-w-0"
        >
          <span className="text-base font-bold text-indigo-400 truncate max-w-[140px]">
            {activeSession?.name ?? 'Counter Ops'}
          </span>
          {sessions.length > 0 && (
            <span className="text-slate-500 text-xs leading-none mt-0.5">▾</span>
          )}
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          <SyncBadge />
          <button
            onClick={() => navigate('settings')}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-lg transition-colors ${
              activeScreen === 'settings' ? 'text-indigo-400' : 'text-slate-400 active:text-slate-300'
            }`}
            aria-label="Settings"
          >
            ⚙️
          </button>
          {memberId && (
            <button onClick={openProfile} className="w-8 h-8 rounded-2xl overflow-hidden flex-shrink-0">
              <MemberAvatar member={member} memberId={memberId} size="sm" showBadges={false} />
            </button>
          )}
        </div>
      </header>

      {/* Offline banner */}
      <OfflineBanner />

      {/* No session state */}
      {sessions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="text-5xl">🏖️</div>
          <h2 className="text-xl font-bold text-slate-100">No sessions yet</h2>
          {adminUnlocked ? (
            <>
              <p className="text-slate-400 text-sm">Create a session to start tracking.</p>
              <button
                onClick={openSwitcher}
                className="bg-indigo-500 text-white px-6 py-3 rounded-2xl font-semibold active:bg-indigo-600"
              >
                + Create session
              </button>
            </>
          ) : (
            <p className="text-slate-400 text-sm">Ask the admin to set up a session.</p>
          )}
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">{children}</main>
      )}

      {/* Bottom nav */}
      <nav
        className="flex bg-slate-900 border-t border-slate-700 flex-shrink-0"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        {NAV.map(({ screen, icon, label }) => (
          <button
            key={screen}
            onClick={() => navigate(screen)}
            className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${
              activeScreen === screen ? 'text-indigo-400' : 'text-slate-400 active:text-slate-200'
            }`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function OfflineBanner() {
  const [offline, setOffline] = React.useState(!navigator.onLine)
  React.useEffect(() => {
    const on = () => setOffline(true)
    const off = () => setOffline(false)
    window.addEventListener('offline', on)
    window.addEventListener('online', off)
    return () => { window.removeEventListener('offline', on); window.removeEventListener('online', off) }
  }, [])
  if (!offline) return null
  return (
    <div className="bg-amber-900 text-amber-200 text-xs text-center py-1 px-4 flex-shrink-0">
      ⚠️ Offline — entries will sync when you reconnect
    </div>
  )
}
