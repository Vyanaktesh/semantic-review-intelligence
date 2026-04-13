import { useState } from 'react'
import { Input, Button, Card, Tag, Empty, Spin, Alert, Rate } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface ReviewResult {
  _id: string
  reviewText: string
  asin: string
  sentiment_score?: number
  cluster_label?: string
  overall?: number
  score?: number
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ReviewResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query.trim())}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : data.results || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to fetch results: ${message}`)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const getSentimentColor = (score?: number) => {
    if (score === undefined) return 'default'
    if (score >= 0.6) return 'success'
    if (score >= 0.3) return 'warning'
    return 'error'
  }

  const getSentimentLabel = (score?: number) => {
    if (score === undefined) return 'Unknown'
    if (score >= 0.6) return 'Positive'
    if (score >= 0.3) return 'Neutral'
    return 'Negative'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-500 text-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-3"
          >
            Semantic Search
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-teal-100 text-lg"
          >
            Search through Amazon reviews using natural language
          </motion.p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto px-6 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-4 flex gap-3"
        >
          <Input
            size="large"
            placeholder='e.g. "great battery life" or "poor quality packaging"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined className="text-teal-400" />}
            className="flex-1 rounded-lg"
            allowClear
          />
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={loading}
            className="rounded-lg px-6 bg-teal-600 border-teal-600 hover:bg-teal-700"
          >
            Search
          </Button>
        </motion.div>
      </div>

      {/* Results */}
      <div className="max-w-3xl mx-auto px-6 py-10">
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

        {loading && (
          <div className="flex justify-center py-20">
            <Spin size="large" tip="Searching reviews..." />
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <Empty
            description="No reviews found for your query"
            className="py-20"
          />
        )}

        <AnimatePresence>
          {!loading && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <p className="text-sm text-gray-500 mb-4">
                Found <strong>{results.length}</strong> results for &quot;{query}&quot;
              </p>
              {results.map((review, i) => (
                <motion.div
                  key={review._id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="rounded-2xl shadow-sm border border-teal-50 hover:shadow-md hover:border-teal-200 transition-all"
                    bordered={false}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag color="teal" className="font-mono text-xs">{review.asin}</Tag>
                        {review.cluster_label && (
                          <Tag color="cyan">{review.cluster_label}</Tag>
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
                          className="text-teal-400 text-sm"
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

        {!searched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-20 text-gray-400"
          >
            <SearchOutlined className="text-6xl text-teal-200 mb-4" />
            <p className="text-lg">Enter a query to search through reviews semantically</p>
            <p className="text-sm mt-2">Try: "comfortable and durable", "fast delivery", "poor sound quality"</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
