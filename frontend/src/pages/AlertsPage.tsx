import { useEffect, useState } from 'react'
import { Card, Empty, Spin, Alert, Tag, Button } from 'antd'
import { BellOutlined, ReloadOutlined, FileTextOutlined, WarningOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiGet, type AlertItem } from '../lib/api'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true); setError(null)
    apiGet<AlertItem[]>('/alerts')
      .then(setAlerts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const high = alerts.filter((a) => a.severity === 'high').length
  const medium = alerts.filter((a) => a.severity === 'medium').length

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-500 text-white py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold mb-1">
            <BellOutlined className="mr-3" /> Negative-Spike Alerts
          </motion.h1>
          <p className="text-rose-100">Products whose negative-review share jumped sharply in the latest period.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Tag color="error" className="border-none px-3 py-1 text-sm">{high} high</Tag>
            <Tag color="warning" className="border-none px-3 py-1 text-sm">{medium} medium</Tag>
          </div>
          <Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
        </div>

        {error && <Alert type="error" showIcon message={error} className="mb-6 rounded-xl" />}
        {loading && <div className="flex justify-center py-16"><Spin size="large" tip="Scanning for anomalies…" /></div>}
        {!loading && alerts.length === 0 && !error && (
          <Empty description="No anomalies detected. Either everyone's happy or there's not enough time-series data." className="py-16" />
        )}

        <div className="space-y-3">
          {alerts.map((a, i) => (
            <motion.div key={`${a.asin}-${a.period}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card variant="borderless"
                className={`rounded-2xl shadow-sm border-l-4 ${a.severity === 'high' ? 'border-rose-500' : 'border-amber-400'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <WarningOutlined className={a.severity === 'high' ? 'text-rose-500' : 'text-amber-500'} />
                      <span className="font-medium text-teal-700">
                        {a.productName && a.productName !== a.asin ? a.productName : a.asin}
                      </span>
                      {a.productName && a.productName !== a.asin && (
                        <span className="font-mono text-xs text-gray-400">{a.asin}</span>
                      )}
                      <Tag color="default" className="border-none">{a.period}</Tag>
                      <Tag color={a.severity === 'high' ? 'error' : 'warning'} className="border-none uppercase text-[10px]">
                        {a.severity}
                      </Tag>
                    </div>
                    <p className="text-gray-700 text-sm">{a.message}</p>
                    <div className="flex gap-4 text-xs text-gray-500 mt-2">
                      <span>Baseline: {(a.baselineNegativeRatio * 100).toFixed(0)}%</span>
                      <span className="text-rose-600 font-medium">Current: {(a.currentNegativeRatio * 100).toFixed(0)}%</span>
                      <span>Δ {(a.delta * 100).toFixed(0)}pp</span>
                      <span>{a.reviewCount} reviews</span>
                    </div>
                  </div>
                  <Link to={`/insights/${a.asin}`}>
                    <Button icon={<FileTextOutlined />} type="primary"
                      className="bg-teal-600 border-teal-600 hover:bg-teal-700">
                      Investigate
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
