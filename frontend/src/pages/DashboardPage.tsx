import { useEffect, useState } from 'react'
import { Card, Statistic, Spin, Alert, Tag, Empty, Skeleton } from 'antd'
import {
  DatabaseOutlined,
  AppstoreOutlined,
  StarFilled,
  SmileOutlined,
  FrownOutlined,
  MehOutlined,
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { apiGet, type Overview, type ProductListItem } from '../lib/api'

const COLORS = { positive: '#10b981', neutral: '#f59e0b', negative: '#ef4444' }

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([apiGet<Overview>('/overview'), apiGet<ProductListItem[]>('/products?limit=10')])
      .then(([ov, ps]) => { if (active) { setOverview(ov); setProducts(ps) } })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="bg-gradient-to-r from-teal-700 to-emerald-500 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold mb-1">
            Dashboard
          </motion.h1>
          <p className="text-teal-100">Live overview of your review catalogue.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 -mt-6">
        {error && <Alert type="error" showIcon message="Could not load dashboard" description={error} className="mb-6 rounded-xl" />}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[0,1,2,3].map((i) => <Card key={i}><Skeleton active paragraph={{ rows: 1 }} /></Card>)}
          </div>
        )}

        {overview && (
          <>
            {/* KPI Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
            >
              <Card variant="borderless" className="rounded-2xl shadow-md border border-teal-50">
                <Statistic title="Total reviews" value={overview.total} prefix={<DatabaseOutlined className="text-teal-500" />} />
              </Card>
              <Card variant="borderless" className="rounded-2xl shadow-md border border-teal-50">
                <Statistic title="Distinct products" value={overview.products} prefix={<AppstoreOutlined className="text-teal-500" />} />
              </Card>
              <Card variant="borderless" className="rounded-2xl shadow-md border border-teal-50">
                <Statistic title="Avg rating" value={overview.avgRating ?? 'n/a'} precision={2} prefix={<StarFilled className="text-amber-400" />} />
              </Card>
              <Card variant="borderless" className="rounded-2xl shadow-md border border-teal-50">
                <Statistic
                  title="Avg polarity"
                  value={overview.avgPolarity}
                  precision={3}
                  valueStyle={{ color: overview.avgPolarity >= 0 ? '#0d9488' : '#dc2626' }}
                  prefix={overview.avgPolarity >= 0.1 ? <SmileOutlined /> : overview.avgPolarity <= -0.1 ? <FrownOutlined /> : <MehOutlined />}
                />
              </Card>
            </motion.div>

            {/* Two-column charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card title="Sentiment distribution" variant="borderless"
                className="rounded-2xl shadow-md border border-teal-50">
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Positive', value: overview.distribution.positive },
                          { name: 'Neutral', value: overview.distribution.neutral },
                          { name: 'Negative', value: overview.distribution.negative },
                        ]}
                        innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        <Cell fill={COLORS.positive} />
                        <Cell fill={COLORS.neutral} />
                        <Cell fill={COLORS.negative} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Top themes" variant="borderless"
                className="rounded-2xl shadow-md border border-teal-50">
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={overview.topThemes} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="label" width={140} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0d9488" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Top products table */}
        <Card title="Top products by review volume" variant="borderless"
          className="rounded-2xl shadow-md border border-teal-50">
          {loading ? <Spin /> : products.length === 0 ? <Empty /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((p) => (
                <motion.div key={p.asin} whileHover={{ y: -3 }}>
                  <Card size="small" variant="borderless"
                    className="rounded-xl shadow-sm border border-teal-50 hover:border-teal-200 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-teal-700 truncate max-w-[140px]" title={p.productName || p.asin}>
                        {p.productName && p.productName !== p.asin ? p.productName : p.asin}
                      </span>
                      <Tag color="teal" className="border-none shrink-0">{p.count}</Tag>
                    </div>
                    {p.productName && p.productName !== p.asin && (
                      <div className="font-mono text-[10px] text-gray-400 mb-1">{p.asin}</div>
                    )}
                    <div className="text-xs text-gray-500 flex flex-col gap-1">
                      <span>★ {p.avgRating ?? 'n/a'}</span>
                      <span>+ {(p.positiveRatio * 100).toFixed(0)}% positive</span>
                      <span>− {(p.negativeRatio * 100).toFixed(0)}% negative</span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
