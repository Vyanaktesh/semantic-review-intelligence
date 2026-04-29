import { useEffect, useMemo, useState } from 'react'
import { Card, Select, Button, Tag, Alert, Spin, Empty, Statistic } from 'antd'
import { SwapOutlined, FileTextOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar,
} from 'recharts'
import { apiGet, type ProductListItem, type ProductSummary } from '../lib/api'

const COMPARE_COLORS = ['#0d9488', '#0891b2', '#7c3aed', '#db2777']

export default function ComparePage() {
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [picked, setPicked] = useState<string[]>([])
  const [comparison, setComparison] = useState<ProductSummary[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCompare, setLoadingCompare] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiGet<ProductListItem[]>('/products?limit=80')
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingProducts(false))
  }, [])

  const onCompare = async () => {
    if (picked.length < 2) return
    setLoadingCompare(true); setError(null)
    try {
      const data = await apiGet<{ asins: string[]; products: ProductSummary[] }>(
        `/compare?asins=${picked.join(',')}`
      )
      setComparison(data.products)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to compare')
    } finally { setLoadingCompare(false) }
  }

  const ratingChart = useMemo(() => comparison.map((p) => ({
    asin: p.productName && p.productName !== p.asin ? p.productName : p.asin,
    rating: p.avgRating ?? 0,
    polarity: p.avgPolarity,
    positive: p.distribution.positive,
    neutral: p.distribution.neutral,
    negative: p.distribution.negative,
  })), [comparison])

  // Use a short display key for each product (name or ASIN)
  const productKey = (p: ProductSummary) =>
    p.productName && p.productName !== p.asin ? p.productName : p.asin

  const radarChart = useMemo(() => {
    if (comparison.length === 0) return []
    const max = {
      total: Math.max(...comparison.map((p) => p.total)) || 1,
    }
    return [
      { metric: 'Volume', ...Object.fromEntries(comparison.map((p) => [productKey(p), p.total / max.total])) },
      { metric: 'Avg rating', ...Object.fromEntries(comparison.map((p) => [productKey(p), (p.avgRating ?? 0) / 5])) },
      { metric: 'Polarity', ...Object.fromEntries(comparison.map((p) => [productKey(p), (p.avgPolarity + 1) / 2])) },
      { metric: '% Positive', ...Object.fromEntries(comparison.map((p) => [productKey(p), p.distribution.positive / Math.max(1, p.total)])) },
      { metric: 'Low complaint', ...Object.fromEntries(comparison.map((p) => [productKey(p), 1 - (p.distribution.negative / Math.max(1, p.total))])) },
    ]
  }, [comparison])

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="bg-gradient-to-r from-teal-700 to-emerald-500 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold mb-1">
            <SwapOutlined className="mr-3" /> Competitor Compare
          </motion.h1>
          <p className="text-teal-100">Stack 2–4 products side-by-side and see who wins on every metric.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Card variant="borderless" className="rounded-2xl shadow-md border border-teal-50 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pick 2–4 products</label>
              <Select
                mode="multiple"
                placeholder={loadingProducts ? 'Loading products…' : 'Search by product name or ASIN…'}
                value={picked}
                onChange={(v) => setPicked(v.slice(0, 4))}
                loading={loadingProducts}
                size="large"
                className="w-full"
                maxTagCount={4}
                options={products.map((p) => ({
                  label: p.productName && p.productName !== p.asin
                    ? `${p.productName} · ${p.count} reviews · ★ ${p.avgRating ?? 'n/a'}`
                    : `${p.asin} · ${p.count} reviews · ★ ${p.avgRating ?? 'n/a'}`,
                  value: p.asin,
                }))}
                showSearch
                optionFilterProp="label"
              />
            </div>
            <Button
              type="primary" size="large" icon={<SwapOutlined />}
              onClick={onCompare} loading={loadingCompare}
              disabled={picked.length < 2}
              className="bg-teal-600 border-teal-600 hover:bg-teal-700"
            >
              Compare {picked.length > 0 && `(${picked.length})`}
            </Button>
          </div>
        </Card>

        {error && <Alert type="error" showIcon message={error} className="mb-6 rounded-xl" />}
        {loadingCompare && <div className="flex justify-center py-16"><Spin size="large" tip="Crunching reviews…" /></div>}
        {!loadingCompare && comparison.length === 0 && !error && (
          <Empty description="Pick at least two products and hit Compare." className="py-16" />
        )}

        {comparison.length > 0 && (
          <>
            {/* Side-by-side cards */}
            <div className={`grid gap-4 mb-6 grid-cols-1 sm:grid-cols-2 ${comparison.length > 2 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'}`}>
              {comparison.map((p, i) => (
                <motion.div key={p.asin} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card variant="borderless" className="rounded-2xl shadow-md border border-teal-50"
                    title={<div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-teal-800 truncate" title={p.productName || p.asin}>
                          {p.productName && p.productName !== p.asin ? p.productName : p.asin}
                        </div>
                        {p.productName && p.productName !== p.asin && (
                          <div className="font-mono text-[10px] text-gray-400">{p.asin}</div>
                        )}
                      </div>
                      <Tag color={COMPARE_COLORS[i].slice(1)} className="border-none shrink-0" style={{ background: COMPARE_COLORS[i] + '20', color: COMPARE_COLORS[i] }}>
                        Product {i + 1}
                      </Tag>
                    </div>}
                  >
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <Statistic title="Reviews" value={p.total} valueStyle={{ fontSize: 18 }} />
                      <Statistic title="Avg rating" value={p.avgRating ?? 'n/a'} precision={2} valueStyle={{ fontSize: 18 }} />
                      <Statistic title="Polarity" value={p.avgPolarity} precision={2} valueStyle={{ fontSize: 18, color: p.avgPolarity >= 0 ? '#0d9488' : '#dc2626' }} />
                      <Statistic title="% Positive" value={(p.distribution.positive / Math.max(1, p.total) * 100).toFixed(0) + '%'} valueStyle={{ fontSize: 18 }} />
                    </div>
                    <div className="flex gap-1.5 mb-3 text-[10px]">
                      <Tag color="success" className="border-none m-0">+ {p.distribution.positive}</Tag>
                      <Tag color="warning" className="border-none m-0">~ {p.distribution.neutral}</Tag>
                      <Tag color="error" className="border-none m-0">− {p.distribution.negative}</Tag>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">Top themes</div>
                    <div className="flex flex-wrap gap-1">
                      {p.topThemes.slice(0, 4).map((t) => (
                        <Tag key={t.label}
                          color={t.avgPolarity > 0.1 ? 'success' : t.avgPolarity < -0.1 ? 'error' : 'default'}
                          className="border-none text-[11px]">
                          {t.label} ({t.count})
                        </Tag>
                      ))}
                    </div>
                    <Link to={`/insights/${p.asin}`}>
                      <Button block size="small" icon={<FileTextOutlined />} className="mt-3">
                        Full insights
                      </Button>
                    </Link>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card title="Sentiment distribution" variant="borderless" className="rounded-2xl shadow-md border border-teal-50">
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={ratingChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="asin" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="positive" stackId="a" fill="#10b981" />
                      <Bar dataKey="neutral" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="negative" stackId="a" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Multi-metric comparison (normalised 0–1)" variant="borderless" className="rounded-2xl shadow-md border border-teal-50">
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <RadarChart data={radarChart}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
                      {comparison.map((p, i) => (
                        <Radar key={p.asin} name={productKey(p)} dataKey={productKey(p)}
                          stroke={COMPARE_COLORS[i]} fill={COMPARE_COLORS[i]} fillOpacity={0.18} />
                      ))}
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
