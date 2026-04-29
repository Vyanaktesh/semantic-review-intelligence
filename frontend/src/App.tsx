import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import SearchPage from './pages/SearchPage'
import DashboardPage from './pages/DashboardPage'
import ComparePage from './pages/ComparePage'
import InsightsPage from './pages/InsightsPage'
import AlertsPage from './pages/AlertsPage'

function App() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/insights/:asin" element={<InsightsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
      </Routes>
    </div>
  )
}

export default App
