import { useState } from 'react'
import { Card, Tag, Input, Button, Badge } from 'antd'
import {
  SearchOutlined,
  StarFilled,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  LaptopOutlined,
  ToolOutlined,
  ShoppingOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  CloudOutlined,
  GlobalOutlined,
  FilterOutlined,
} from '@ant-design/icons'
import { motion } from 'framer-motion'

interface Supplier {
  id: number
  name: string
  initials: string
  color: string
  category: string
  products: number
  rating: number
  verified: boolean
  desc: string
  icon: React.ReactNode
  tags: string[]
}

const SUPPLIERS: Supplier[] = [
  {
    id: 1,
    name: 'TechSource Global',
    initials: 'TS',
    color: '#1D4ED8',
    category: 'Electronics',
    products: 2400,
    rating: 4.8,
    verified: true,
    desc: 'Global leader in consumer electronics components and accessories with ISO 9001 certification.',
    icon: <LaptopOutlined className="text-xl text-white" />,
    tags: ['Wholesale', 'B2B', 'Fast Ship'],
  },
  {
    id: 2,
    name: 'Prime Components',
    initials: 'PC',
    color: '#7C3AED',
    category: 'Hardware',
    products: 1850,
    rating: 4.6,
    verified: true,
    desc: 'Premium hardware supplier trusted by Fortune 500 manufacturers across 60+ countries.',
    icon: <ToolOutlined className="text-xl text-white" />,
    tags: ['OEM', 'Bulk Orders', 'Certified'],
  },
  {
    id: 3,
    name: 'RetailHub Inc.',
    initials: 'RH',
    color: '#059669',
    category: 'Retail',
    products: 3200,
    rating: 4.7,
    verified: true,
    desc: 'Full-spectrum retail solutions from sourcing to last-mile delivery, serving 10,000+ brands.',
    icon: <ShoppingOutlined className="text-xl text-white" />,
    tags: ['Drop-ship', 'White Label', 'API'],
  },
  {
    id: 4,
    name: 'DataLogix Corp.',
    initials: 'DL',
    color: '#DC2626',
    category: 'Software',
    products: 640,
    rating: 4.3,
    verified: false,
    desc: 'Enterprise data management and analytics software supplier specializing in real-time insights.',
    icon: <DatabaseOutlined className="text-xl text-white" />,
    tags: ['SaaS', 'Analytics', 'Enterprise'],
  },
  {
    id: 5,
    name: 'NexGen Supplies',
    initials: 'NG',
    color: '#D97706',
    category: 'Industrial',
    products: 5100,
    rating: 4.5,
    verified: true,
    desc: 'Industrial-grade supply chain management and procurement services for large-scale operations.',
    icon: <ThunderboltOutlined className="text-xl text-white" />,
    tags: ['Industrial', 'Bulk', 'Global'],
  },
  {
    id: 6,
    name: 'CloudRetail Co.',
    initials: 'CR',
    color: '#0891B2',
    category: 'Cloud / SaaS',
    products: 280,
    rating: 4.9,
    verified: true,
    desc: 'Cloud-native retail intelligence and inventory management platform with 99.9% uptime SLA.',
    icon: <CloudOutlined className="text-xl text-white" />,
    tags: ['Cloud', 'AI-Powered', 'Scalable'],
  },
  {
    id: 7,
    name: 'GlobalMerch Ltd.',
    initials: 'GM',
    color: '#374151',
    category: 'General Merchandise',
    products: 8900,
    rating: 4.4,
    verified: true,
    desc: 'One-stop general merchandise supplier with extensive catalog coverage across all categories.',
    icon: <GlobalOutlined className="text-xl text-white" />,
    tags: ['Wholesale', 'Mixed Cargo', 'MOQ Flex'],
  },
  {
    id: 8,
    name: 'SwiftSource Inc.',
    initials: 'SS',
    color: '#BE185D',
    category: 'Fashion & Apparel',
    products: 4100,
    rating: 4.6,
    verified: true,
    desc: 'Trend-forward fashion and apparel supplier with rapid prototyping and sustainable sourcing.',
    icon: <ShoppingOutlined className="text-xl text-white" />,
    tags: ['Sustainable', 'Fast Fashion', 'Private Label'],
  },
]

const CATEGORIES = ['All', 'Electronics', 'Hardware', 'Retail', 'Software', 'Industrial', 'Cloud / SaaS', 'General Merchandise', 'Fashion & Apparel']

export default function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = SUPPLIERS.filter((s) => {
    const matchesSearch =
      !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.desc.toLowerCase().includes(search.toLowerCase())
    const matchesCat = activeCategory === 'All' || s.category === activeCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-900 to-brand-700 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 bg-accent-500/20 border border-accent-400/40 text-accent-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 uppercase tracking-wide">
              ✦ Verified Supplier Network
            </span>
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">Supplier Directory</h1>
            <p className="text-blue-200 text-lg max-w-xl mx-auto">
              Discover and connect with {SUPPLIERS.length} verified business suppliers across every category.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-8 mt-10 text-center"
          >
            {[
              { value: `${SUPPLIERS.length}+`, label: 'Listed Suppliers' },
              { value: `${SUPPLIERS.filter((s) => s.verified).length}`, label: 'Verified Partners' },
              { value: `${(SUPPLIERS.reduce((a, s) => a + s.products, 0) / 1000).toFixed(0)}K+`, label: 'Total Products' },
              { value: (SUPPLIERS.reduce((a, s) => a + s.rating, 0) / SUPPLIERS.length).toFixed(1), label: 'Avg. Rating' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-extrabold text-accent-400">{stat.value}</p>
                <p className="text-xs text-blue-300 font-medium mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="max-w-5xl mx-auto px-6 -mt-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 flex gap-3"
        >
          <Input
            size="large"
            placeholder="Search suppliers by name, category, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<SearchOutlined className="text-brand-400" />}
            suffix={<FilterOutlined className="text-gray-300" />}
            className="flex-1 rounded-lg"
            allowClear
          />
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            className="rounded-lg px-7 font-bold"
          >
            Search
          </Button>
        </motion.div>
      </div>

      {/* Category pills */}
      <div className="max-w-5xl mx-auto px-6 mt-6">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150 cursor-pointer
                ${activeCategory === cat
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-700'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="max-w-5xl mx-auto px-6 mt-5">
        <p className="text-sm text-gray-500">
          Showing <strong>{filtered.length}</strong> supplier{filtered.length !== 1 ? 's' : ''}
          {activeCategory !== 'All' && <> in <strong>{activeCategory}</strong></>}
          {search && <> matching &quot;<strong>{search}</strong>&quot;</>}
        </p>
      </div>

      {/* Supplier grid */}
      <div className="max-w-5xl mx-auto px-6 py-6 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <SearchOutlined className="text-5xl text-gray-200 mb-4" />
            <p className="text-lg">No suppliers found</p>
            <p className="text-sm mt-1">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
              >
                <Card
                  bordered={false}
                  className="rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-200 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div
                      className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 shadow-sm gap-0.5"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.icon}
                      <span className="text-white text-[10px] font-extrabold tracking-wider">{s.initials}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-extrabold text-gray-900">{s.name}</span>
                            {s.verified && (
                              <SafetyCertificateOutlined className="text-brand-600 text-sm" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{s.category}</p>
                        </div>
                        <Badge
                          count={
                            s.verified
                              ? <span className="flex items-center gap-0.5 bg-blue-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-200">
                                  <CheckCircleFilled className="text-brand-600" /> Verified
                                </span>
                              : null
                          }
                        />
                      </div>

                      <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{s.desc}</p>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="flex items-center gap-1 text-xs font-bold text-accent-600">
                          <StarFilled className="text-accent-500" />
                          {s.rating}
                        </span>
                        <span className="text-xs text-gray-400">{s.products.toLocaleString()} products</span>
                        <div className="flex gap-1 flex-wrap">
                          {s.tags.map((t) => (
                            <Tag key={t} className="text-[10px] font-semibold m-0 rounded-full px-2">{t}</Tag>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
