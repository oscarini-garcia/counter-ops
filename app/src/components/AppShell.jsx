import React from 'react'
import { useStore, useNavigate } from '../hooks/useStore.jsx'
import { useMember } from '../hooks/useMember.js'
import SyncBadge from './SyncBadge.jsx'
import MemberAvatar from './MemberAvatar.jsx'

const NAV = [
  { screen: 'home',    icon: '🏠', label: 'Home'    },
  { screen: 'log',     icon: '➕', label: 'Log'     },
  { screen: 'entries', icon: '📋', label: 'Log'     },
  { screen: 'report',  icon: '📊', label: 'Report'  },
]

export default function AppShell({ children }) {
  const { activeScreen, syncStatus } = useStore()
  const { memberId, member } = useMember()
  const navigate = useNavigate()

  function openProfile() {
    // dispatch is from useDispatch, but we read store here — trigger via event
    window.dispatchEvent(new CustomEvent('counter-ops:open-profile'))
  }

  return (
    <div className="flex flex-col h-full" style={{ paddingTop: 'var(--safe-top)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700 flex-shrink-0 z-10">
        <button onClick={() => navigate('home')} className="text-lg font-bold text-indigo-400 tracking-tight">
          Counter Ops
        </button>
        <div className="flex items-center gap-2">
          <SyncBadge />
          {memberId && (
            <button onClick={openProfile} className="w-8 h-8 rounded-full overflow-hidden">
              <MemberAvatar member={member} memberId={memberId} size="sm" showBadges={false} />
            </button>
          )}
        </div>
      </header>

      {/* Offline banner */}
      <OfflineBanner />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

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
