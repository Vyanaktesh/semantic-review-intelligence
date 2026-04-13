import { useState } from 'react'
import { Input, Button, Card, Tag, Empty, Spin, Alert, Rate, Tabs, Pagination } from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  ShopOutlined,
  StarFilled,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  ThunderboltOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const PAGE_SIZE = 5

interface ReviewResult {
  _id: string
  reviewText: string
  asin: string
  sentiment_score?: number
  cluster_label?: string
  overall?: number
  score?: number
}

const SUPPLIERS = [
  {
    id: 1, name: 'TechSource Global', initials: 'TS', color: '#1D4ED8',
    category: 'Electronics', products: 2400, rating: 4.8, verified: true,
    desc: 'Global leader in consumer electronics components and accessories.',
  },
  {
    id: 2, name: 'Prime Components', initials: 'PC', color: '#7C3AED',
    category: 'Hardware', products: 1850, rating: 4.6, verified: true,
    desc: 'Premium hardware supplier trusted by Fortune 500 manufacturers.',
  },
  {
    id: 3, name: 'RetailHub Inc.', initials: 'RH', color: '#059669',
    category: 'Retail', products: 3200, rating: 4.7, verified: true,
    desc: 'Full-spectrum retail solutions from sourcing to last-mile delivery.',
  },
  {
    id: 4, name: 'DataLogix Corp.', initials: 'DL', color: '#DC2626',
    category: 'Software', products: 640, rating: 4.3, verified: false,
    desc: 'Enterprise data management and analytics software supplier.',
  },
  {
    id: 5, name: 'NexGen Supplies', initials: 'NG', color: '#D97706',
    category: 'Industrial', products: 5100, rating: 4.5, verified: true,
    desc: 'Industrial-grade supply chain management and procurement services.',
  },
  {
    id: 6, name: 'CloudRetail Co.', initials: 'CR', color: '#0891B2',
    category: 'Cloud / SaaS', products: 280, rating: 4.9, verified: true,
    desc: 'Cloud-native retail intelligence and inventory management platform.',
  },
]

function getSentimentColor(score?: number) {
  if (score === undefined) return 'default'
  if (score >= 0.6) return 'success'
  if (score >= 0.3) return 'warning'
  return 'error'
}

function getSentimentLabel(score?: number) {
  if (score === undefined) return 'Unknown'
  if (score >= 0.6) return 'Positive'
  if (score >= 0.3) return 'Neutral'
  return 'Negative'
}

export default function SearchPage() {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<ReviewResult[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [page, setPage]         = useState(1)
  const [activeTab, setActiveTab] = useState('reviews')

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)
    setPage(1)
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query.trim())}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : data.results ?? [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to fetch results: ${message}`)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const pagedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const reviewsTab = (
    <div>
      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex gap-3 mb-8"
      >
        <Input
          size="large"
          placeholder='e.g. "great battery life" or "poor packaging quality"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onPressEnter={handleSearch}
          prefix={<SearchOutlined className="text-brand-400 text-base" />}
          className="flex-1 rounded-lg text-sm"
          allowClear
        />
        <Button
          type="primary"
          size="large"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          loading={loading}
          className="rounded-lg px-7 font-bold h-10 my-auto"
        >
          Search
        </Button>
      </motion.div>

      {/* Error */}
      {error && (
        <Alert
          message="Search Error"
          description={error}
          type="error"
          showIcon
          className="mb-6 rounded-xl"
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={handleSearch}>
              Retry
            </Button>
          }
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Spin size="large" />
          <p className="text-gray-400 text-sm">Searching reviews with semantic AI…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && results.length === 0 && !error && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className="text-gray-400">No reviews found for <strong>&quot;{query}&quot;</strong></span>}
          className="py-24"
        />
      )}

      {/* Results */}
      <AnimatePresence>
        {!loading && pagedResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">
                Showing <strong>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, results.length)}</strong> of <strong>{results.length}</strong> results for &quot;{query}&quot;
              </p>
              <Tag icon={<ThunderboltOutlined />} color="blue" className="text-xs font-semibold">
                Semantic AI
              </Tag>
            </div>

            {pagedResults.map((review, i) => (
              <motion.div
                key={review._id || i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-200 transition-all duration-200"
                  bordered={false}
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag color="blue" className="font-mono text-xs">{review.asin}</Tag>
                      {review.cluster_label && (
                        <Tag color="geekblue">{review.cluster_label}</Tag>
                      )}
                      <Tag color={getSentimentColor(review.sentiment_score)}>
                        {getSentimentLabel(review.sentiment_score)}
                        {review.sentiment_score !== undefined && (
                          <span className="ml-1 opacity-70">
                            ({(review.sentiment_score * 100).toFixed(0)}%)
                          </span>
                        )}
                      </Tag>
                      {review.score !== undefined && (
                        <Tag color="purple" className="text-xs">
                          Relevance: {(review.score * 100).toFixed(1)}%
                        </Tag>
                      )}
                    </div>
                    {review.overall && (
                      <Rate
                        disabled
                        value={review.overall}
                        count={5}
                        className="text-accent-500 text-sm"
                        character={<StarFilled />}
                      />
                    )}
                    <p className="text-gray-700 text-sm leading-relaxed">{review.reviewText}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle prompt */}
      {!searched && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-24 text-gray-400"
        >
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-brand-50 flex items-center justify-center">
            <SearchOutlined className="text-3xl text-brand-300" />
          </div>
          <p className="text-lg font-medium text-gray-500">Enter a query to search through reviews semantically</p>
          <p className="text-sm mt-2 text-gray-400">Try: &quot;comfortable and durable&quot;, &quot;fast delivery&quot;, &quot;poor sound quality&quot;</p>
        </motion.div>
      )}

      {/* Pagination — bottom center */}
      {results.length > PAGE_SIZE && !loading && (
        <div className="flex justify-center mt-10">
          <Pagination
            current={page}
            total={results.length}
            pageSize={PAGE_SIZE}
            onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            showSizeChanger={false}
            className="font-medium"
          />
        </div>
      )}
    </div>
  )

  const suppliersTab = (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
        {SUPPLIERS.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -4 }}
          >
            <Card
              bordered={false}
              className="rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-200 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                {/* Logo badge */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-extrabold flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: s.color }}
                >
                  {s.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-gray-900 truncate">{s.name}</span>
                    {s.verified && (
                      <SafetyCertificateOutlined className="text-brand-600 text-sm flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{s.category}</p>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{s.desc}</p>
                  <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-accent-600 font-semibold">
                      <StarFilled className="text-accent-500" />
                      {s.rating}
                    </span>
                    <span className="text-xs text-gray-400">{s.products.toLocaleString()} products</span>
                    {s.verified
                      ? <Tag color="blue" className="text-xs m-0"><CheckCircleFilled className="mr-0.5" />Verified</Tag>
                      : <Tag color="default" className="text-xs m-0">Unverified</Tag>
                    }
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <Link to="/suppliers">
          <Button type="primary" icon={<ArrowRightOutlined />} iconPosition="end" size="large" className="rounded-lg px-8 font-bold h-11">
            View All Suppliers
          </Button>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-gradient-to-r from-brand-900 to-brand-700 text-white py-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold mb-3 tracking-tight"
          >
            Explore Intelligence
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-blue-200 text-lg"
          >
            Search reviews semantically or discover verified supplier partners
          </motion.p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            items={[
              {
                key: 'reviews',
                label: (
                  <span className="flex items-center gap-2 font-semibold">
                    <SearchOutlined />
                    Review Search
                  </span>
                ),
                children: reviewsTab,
              },
              {
                key: 'suppliers',
                label: (
                  <span className="flex items-center gap-2 font-semibold">
                    <ShopOutlined />
                    Suppliers
                  </span>
                ),
                children: suppliersTab,
              },
            ]}
          />
        </div>
      </div>

      <div className="pb-16" />
    </div>
  )
}
