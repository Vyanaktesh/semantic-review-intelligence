import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Avatar, Button } from 'antd'
import { HomeOutlined, SearchOutlined, ShopOutlined } from '@ant-design/icons'

const navLinks = [
  { to: '/', label: 'Home', icon: <HomeOutlined /> },
  { to: '/search', label: 'Search', icon: <SearchOutlined /> },
  { to: '/suppliers', label: 'Suppliers', icon: <ShopOutlined /> },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm"
    >
      <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-9 h-9 bg-brand-700 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-white font-extrabold text-xs tracking-widest">SR</span>
          </div>
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-base font-extrabold text-brand-800 tracking-tight">SRIS</span>
            <span className="hidden sm:block text-[10px] text-gray-400 font-medium uppercase tracking-wide">
              Semantic Review Intelligence
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <Button
                type={location.pathname === link.to ? 'primary' : 'text'}
                icon={link.icon}
                className="rounded-lg font-semibold text-sm h-9 px-4"
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* User avatar */}
        <Avatar
          style={{
            backgroundColor: '#1D4ED8',
            fontWeight: 800,
            fontSize: 16,
            cursor: 'default',
            flexShrink: 0,
          }}
          size={38}
        >
          V
        </Avatar>
      </div>
    </motion.nav>
  )
}
