import { useEffect, useState } from 'react'
import { Card, Select, Button, Tag, Alert, Spin, Empty, Statistic, Progress } from 'antd'
import {
  FileTextOutlined, DownloadOutlined, RiseOutlined, FallOutlined,
  BulbOutlined, AimOutlined, MessageOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { apiGet, API_BASE, type Insights, type ProductListItem, type TimelinePoint } from '../lib/api'

export default function InsightsPage() {
  const { asin } = useParams<{ asin?: string }>()
  const navigate = useNavigate()
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [data, setData] = useState<Insights | null>(null)
  const [timeline, setTimeline] = useState<TimelinePoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiGet<ProductListItem[]>('/products?limit=80')
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingProducts(false))
  }, [])

  useEffect(() => {
    if (!asin) { setData(null); return }
    setLoading(true); setError(null)
    Promise.all([
      apiGet<Insights>(`/insights/${asin}`),
      apiGet<TimelinePoint[]>(`/products/${asin}/timeline?bucket=month`).catch(() => []),
    ])
      .then(([d, t]) => { setData(d); setTimeline(t) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [asin])

  const downloadReport = (format: 'docx' | 'md') => {
    window.open(`${API_BASE}/report/${asin}?format=${format}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="bg-gradient-to-r from-teal-700 to-emerald-500 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold mb-1">
            <FileTextOutlined className="mr-3" /> Auto Insights
          </motion.h1>
          <p className="text-teal-100">One-click executive summary, themes, quotes, and recommendations.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Card variant="borderless" className="rounded-2xl shadow-md border border-teal-50 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <Select
                placeholder={loadingProducts ? 'Loading products…' : 'Search by product name or ASIN…'}
                value={asin}
                onChange={(v) => navigate(`/insights/${v}`)}
                loading={loadingProducts}
                size="large"
                className="w-full"
                showSearch
                optionFilterProp="label"
                options={products.map((p) => ({
                  label: p.productName && p.productName !== p.asin
                    ? `${p.productName} · ${p.count} reviews · ★ ${p.avgRating ?? 'n/a'}`
                    : `${p.asin} · ${p.count} reviews · ★ ${p.avgRating ?? 'n/a'}`,
                  value: p.asin,
                }))}
              />
            </div>
            {asin && (
              <div className="flex gap-2">
                <Button size="large" icon={<DownloadOutlined />} onClick={() => downloadReport('docx')}>
                  Word
                </Button>
                <Button size="large" icon={<DownloadOutlined />} onClick={() => downloadReport('md')}>
                  Markdown
                </Button>
              </div>
            )}
          </div>
        </Card>

        {error && <Alert type="error" showIcon message={error} className="mb-6 rounded-xl" />}
        {!asin && !error && <Empty description="Pick a product to generate its insights report." className="py-16" />}

        {/* Product name banner */}
        {data && !loading && data.summary.productName && data.summary.productName !== data.summary.asin && (
          <div className="mb-4 text-lg font-semibold text-teal-800">
            {data.summary.productName}
            <span className="ml-2 text-sm font-mono text-gray-400">{data.summary.asin}</span>
          </div>
        )}
        {loading && <div className="flex justify-center py-16"><Spin size="large" tip="Generating insights…" /></div>}

        {data && !loading && (
          <>
            {/* Summary KPI row */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card variant="borderless" className="rounded-2xl shadow-md border border-teal-50">
                <Statistic title="Reviews analysed" value={data.summary.total} />
              </Card>
              <Card variant="borderless" className="rounded-2xl shadow-md border border-teal-50">
                <Statistic title="Avg rating" value={data.summary.avgRating ?? 'n/a'} precision={2} />
              </Card>
              <Card variant="borderless" className="rounded-2xl shadow-md border border-teal-50">
                <Statistic title="Polarity" value={data.summary.avgPolarity} precision={2}
                  valueStyle={{ color: data.summary.avgPolarity >= 0 ? '#0d9488' : '#dc2626' }} />
              </Card>
              <Card variant="borderless" className="rounded-2xl shadow-md border border-teal-50">
                <div className="text-gray-500 text-sm mb-1">Sentiment mix</div>
                <Progress
                  percent={100}
                  showInfo={false}
                  strokeLinecap="butt"
                  success={{ percent: data.summary.distribution.positive / Math.max(1, data.summary.total) * 100, strokeColor: '#10b981' }}
                  strokeColor="#ef4444"
                  trailColor="#f59e0b"
                  className="!mb-0"
                />
                <div className="text-[11px] text-gray-500 mt-1 flex justify-between">
                  <span className="text-emerald-600">+ {data.summary.distribution.positive}</span>
                  <span className="text-amber-600">~ {data.summary.distribution.neutral}</span>
                  <span className="text-rose-600">− {data.summary.distribution.negative}</span>
                </div>
              </Card>
            </motion.div>

            {/* Headline insights */}
            <Card variant="borderless"
              className="rounded-2xl shadow-md border border-teal-50 mb-6"
              title={<span><BulbOutlined className="text-amber-500 mr-2" />Executive summary</span>}
            >
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                {data.insights.headline.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </Card>

            {/* Recommendations */}
            <Card variant="borderless"
              className="rounded-2xl shadow-md border border-teal-50 mb-6 bg-gradient-to-br from-teal-50/40 to-white"
              title={<span><AimOutlined className="text-teal-600 mr-2" />Recommendations</span>}
            >
              {data.insights.recommendations.length === 0 ? (
                <span className="text-gray-400">No specific recommendations at this time.</span>
              ) : (
                <ul className="space-y-2">
                  {data.insights.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2 text-gray-700">
                      <span className="text-teal-500 mt-0.5">→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Two columns: positive vs negative */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card variant="borderless" className="rounded-2xl shadow-md border border-teal-50"
                title={<span><RiseOutlined className="text-emerald-500 mr-2" />What customers love</span>}
              >
                {data.positiveThemes.length === 0 ? <span className="text-gray-400">No clearly positive themes.</span> : (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {data.positiveThemes.map((t) => (
                      <Tag key={t.label} color="success" className="border-none">{t.label} ({t.count})</Tag>
                    ))}
                  </div>
                )}
                <div className="text-sm text-gray-500 mb-2"><MessageOutlined /> Sample quotes</div>
                {data.positiveQuotes.map((q, i) => (
                  <blockquote key={i} className="border-l-4 border-emerald-400 pl-3 py-1 mb-2 text-gray-700 text-sm italic">
                    "{q.text}"
                  </blockquote>
                ))}
              </Card>

              <Card variant="borderless" className="rounded-2xl shadow-md border border-teal-50"
                title={<span><FallOutlined className="text-rose-500 mr-2" />Top complaints</span>}
              >
                {data.negativeThemes.length === 0 ? <span className="text-gray-400">No clearly negative themes.</span> : (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {data.negativeThemes.map((t) => (
                      <Tag key={t.label} color="error" className="border-none">{t.label} ({t.count})</Tag>
                    ))}
                  </div>
                )}
                <div className="text-sm text-gray-500 mb-2"><MessageOutlined /> Sample quotes</div>
                {data.negativeQuotes.map((q, i) => (
                  <blockquote key={i} className="border-l-4 border-rose-400 pl-3 py-1 mb-2 text-gray-700 text-sm italic">
                    "{q.text}"
                  </blockquote>
                ))}
              </Card>
            </div>

            {/* Timeline */}
            {timeline.length > 0 && (
              <Card title="Sentiment over time" variant="borderless"
                className="rounded-2xl shadow-md border border-teal-50">
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <LineChart data={timeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="neutral" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
