import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HomeOutlined,
  SearchOutlined,
  DashboardOutlined,
  SwapOutlined,
  FileTextOutlined,
  BellOutlined,
} from '@ant-design/icons'

export default function Navbar() {
  const location = useLocation()

  const navLinks = [
    { to: '/', label: 'Home', icon: <HomeOutlined /> },
    { to: '/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
    { to: '/search', label: 'Search', icon: <SearchOutlined /> },
    { to: '/compare', label: 'Compare', icon: <SwapOutlined /> },
    { to: '/insights', label: 'Insights', icon: <FileTextOutlined /> },
    { to: '/alerts', label: 'Alerts', icon: <BellOutlined /> },
  ]

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-teal-100 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold shadow-md">
            S
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
              SRIS
            </span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-teal-600 font-medium">
              Review Intelligence
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                isActive(link.to)
                  ? 'bg-teal-50 text-teal-700 shadow-sm'
                  : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50/50'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </motion.nav>
  )
}
