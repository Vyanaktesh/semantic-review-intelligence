import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import SearchPage from './pages/SearchPage'
import SuppliersPage from './pages/SuppliersPage'

function App() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
      </Routes>
    </div>
  )
}

export default App
