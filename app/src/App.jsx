import React, { lazy, Suspense } from 'react'
import { StoreProvider, useStore } from './hooks/useStore.jsx'
import AppShell from './components/AppShell.jsx'
import ProfileModal from './components/ProfileModal.jsx'
import ConfettiOverlay from './components/ConfettiOverlay.jsx'
import TauntToast from './components/TauntToast.jsx'
import SyncBootstrap from './components/SyncBootstrap.jsx'
import SessionSwitcher from './components/SessionSwitcher.jsx'

const HomeScreen = lazy(() => import('./screens/HomeScreen.jsx'))
const LogEntryScreen = lazy(() => import('./screens/LogEntryScreen.jsx'))
const EntryLogScreen = lazy(() => import('./screens/EntryLogScreen.jsx'))
const ReportScreen = lazy(() => import('./screens/ReportScreen.jsx'))
const AdminScreen = lazy(() => import('./screens/AdminScreen.jsx'))
const SettingsScreen = lazy(() => import('./screens/SettingsScreen.jsx'))

function ScreenRouter() {
  const { activeScreen, adminUnlocked } = useStore()

  const screens = {
    home: <HomeScreen />,
    log: <LogEntryScreen />,
    entries: <EntryLogScreen />,
    report: <ReportScreen />,
    admin: adminUnlocked ? <AdminScreen /> : <HomeScreen />,
    settings: <SettingsScreen />,
  }

  return screens[activeScreen] ?? <HomeScreen />
}

export default function App() {
  return (
    <StoreProvider>
      <SyncBootstrap />
      <AppShell>
        <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-400">Loading…</div>}>
          <ScreenRouter />
        </Suspense>
      </AppShell>
      <ProfileModal />
      <SessionSwitcher />
      <ConfettiOverlay />
      <TauntToast />
    </StoreProvider>
  )
}
