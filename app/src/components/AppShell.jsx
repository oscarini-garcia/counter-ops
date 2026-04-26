import React from 'react'
import { useStore, useDispatch, useNavigate } from '../hooks/useStore.jsx'
import { useMember } from '../hooks/useMember.js'
import SyncBadge from './SyncBadge.jsx'
import MemberAvatar from './MemberAvatar.jsx'

// SVG nav icons
function IcoHome({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 11.5L12 4l9 7.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 9.5V19a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1V9.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IcoPlus({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
      <path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function IcoList({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M8 6h12M8 12h12M8 18h12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="4" cy="6"  r="1.5" fill={color}/>
      <circle cx="4" cy="12" r="1.5" fill={color}/>
      <circle cx="4" cy="18" r="1.5" fill={color}/>
    </svg>
  )
}
function IcoChart({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 20h18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <rect x="4"  y="12" width="4"  height="8"  rx="1.5" fill={color}/>
      <rect x="10" y="7"  width="4"  height="13" rx="1.5" fill={color}/>
      <rect x="16" y="3"  width="4"  height="17" rx="1.5" fill={color}/>
    </svg>
  )
}

const NAV = [
  { screen: 'home',    label: 'Home',    Icon: IcoHome  },
  { screen: 'log',     label: 'Log',     Icon: IcoPlus  },
  { screen: 'entries', label: 'Entries', Icon: IcoList  },
  { screen: 'report',  label: 'Report',  Icon: IcoChart },
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
      <header
        className="flex items-center justify-between px-4 py-3 flex-shrink-0 z-10"
        style={{
          background: 'var(--c-surface)',
          borderBottom: '1px solid var(--c-border)',
        }}
      >
        {/* Session name */}
        <button
          onClick={openSwitcher}
          className="flex items-center gap-1.5 text-left min-w-0"
        >
          <div>
            <div
              className="text-base font-extrabold truncate max-w-[160px] leading-tight"
              style={{ color: 'var(--c-brand)' }}
            >
              {activeSession?.name ?? 'Counter Ops'}
            </div>
            {sessions.length > 0 && (
              <div className="text-xs leading-none" style={{ color: 'var(--c-text-muted)' }}>
                Counter Ops ▾
              </div>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          <SyncBadge />
          <button
            onClick={() => navigate('settings')}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{
              color: activeScreen === 'settings' ? 'var(--c-brand)' : 'var(--c-text-muted)',
            }}
            aria-label="Settings"
          >
            {/* Settings gear icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
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

      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Bottom nav */}
      <nav
        className="flex flex-shrink-0"
        style={{
          background: 'var(--c-surface)',
          borderTop: '1px solid var(--c-border)',
          paddingBottom: 'var(--safe-bottom)',
        }}
      >
        {NAV.map(({ screen, label, Icon }) => {
          const active = activeScreen === screen
          const color = active ? 'var(--c-brand)' : 'var(--c-text-muted)'
          return (
            <button
              key={screen}
              onClick={() => navigate(screen)}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
              style={{ color, fontSize: 10, fontWeight: active ? 800 : 500 }}
            >
              <Icon color={active ? 'var(--c-brand)' : 'var(--c-text-muted)'} />
              <span>{label}</span>
              {active && (
                <div
                  className="w-1 h-1 rounded-full mt-0.5"
                  style={{ background: 'var(--c-brand)' }}
                />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function OfflineBanner() {
  const [offline, setOffline] = React.useState(!navigator.onLine)
  React.useEffect(() => {
    const on  = () => setOffline(true)
    const off = () => setOffline(false)
    window.addEventListener('offline', on)
    window.addEventListener('online',  off)
    return () => {
      window.removeEventListener('offline', on)
      window.removeEventListener('online',  off)
    }
  }, [])
  if (!offline) return null
  return (
    <div className="text-xs text-center py-1 px-4 flex-shrink-0" style={{ background: '#fef3c7', color: '#92400e' }}>
      ⚠️ Offline — entries will sync when you reconnect
    </div>
  )
}
