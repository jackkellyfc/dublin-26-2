import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Progress from './pages/Progress'
import Strength from './pages/Strength'
import Settings from './pages/Settings'
import RunTracker from './pages/RunTracker'
import { useLocalStorage } from './hooks/useLocalStorage'
import { DEFAULT_APP_STATE } from './hooks/useAdaptivePlan'
import type { AppState } from './hooks/useAdaptivePlan'

export default function App() {
  const location = useLocation()
  const [appState, setAppState] = useLocalStorage<AppState>('dublin262-state', DEFAULT_APP_STATE)

  return (
    <div className="app-shell">
      <div className="page-content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Dashboard appState={appState} setAppState={setAppState} />} />
            <Route path="/calendar" element={<Calendar appState={appState} setAppState={setAppState} />} />
            <Route path="/progress" element={<Progress appState={appState} />} />
            <Route path="/run" element={<RunTracker appState={appState} setAppState={setAppState} />} />
            <Route path="/strength" element={<Strength />} />
            <Route path="/settings" element={<Settings appState={appState} setAppState={setAppState} />} />
          </Routes>
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  )
}
