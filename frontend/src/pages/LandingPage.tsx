import { Button, Card, Tag } from 'antd'
import { motion, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  SearchOutlined,
  DashboardOutlined,
  SwapOutlined,
  FileTextOutlined,
  BellOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  GithubOutlined,
} from '@ant-design/icons'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
}

const features = [
  {
    icon: <DashboardOutlined className="text-3xl text-teal-500" />,
    title: 'Live Dashboard',
    desc: 'KPI cards, sentiment distribution, and theme breakdown for your entire review catalogue.',
    tag: 'Analytics',
    to: '/dashboard',
  },
  {
    icon: <SearchOutlined className="text-3xl text-teal-500" />,
    title: 'Semantic Search',
    desc: 'Find reviews by meaning — "battery dies fast" surfaces the same complaints worded twenty different ways.',
    tag: 'NLP',
    to: '/search',
  },
  {
    icon: <SwapOutlined className="text-3xl text-teal-500" />,
    title: 'Competitor Compare',
    desc: 'Stack any 2–4 ASINs side-by-side: ratings, sentiment, top complaints, top praises.',
    tag: 'New',
    to: '/compare',
  },
  {
    icon: <FileTextOutlined className="text-3xl text-teal-500" />,
    title: 'Auto-generated Reports',
    desc: 'One-click Word/Markdown report with executive summary, themes, quotes, and recommendations.',
    tag: 'New',
    to: '/insights',
  },
  {
    icon: <BellOutlined className="text-3xl text-teal-500" />,
    title: 'Negative-Spike Alerts',
    desc: 'We watch every product\'s monthly sentiment and flag spikes before they snowball into a 1-star avalanche.',
    tag: 'New',
    to: '/alerts',
  },
  {
    icon: <RocketOutlined className="text-3xl text-teal-500" />,
    title: 'Production Stack',
    desc: 'React 19 · Node + Express · MongoDB Atlas · Xenova transformers — all open source.',
    tag: 'Stack',
    to: null,
  },
]

const stats = [
  { value: 'Atlas', label: 'Cloud MongoDB', icon: <ThunderboltOutlined /> },
  { value: 'all-MiniLM-L6', label: 'Embedding model', icon: <SearchOutlined /> },
  { value: 'docx', label: 'Report exports', icon: <FileTextOutlined /> },
  { value: 'Real-time', label: 'Spike detection', icon: <LineChartOutlined /> },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-500 to-emerald-400 text-white py-28 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.18),_transparent_60%)] pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Tag color="gold" className="mb-5 text-sm px-3 py-1 rounded-full font-medium border-none">
              ✨ Turn 1-star reviews into 5-star fixes
            </Tag>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}
            className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6 drop-shadow-lg"
          >
            Customer reviews,<br />
            <span className="text-white/85">decoded.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
            className="text-xl text-teal-50 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Semantic search, competitor benchmarks, auto-generated reports, and real-time alerts —
            so you stop drowning in reviews and start acting on them.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/dashboard">
              <Button type="primary" size="large" icon={<DashboardOutlined />}
                className="h-12 px-8 text-base font-semibold rounded-lg shadow-lg bg-white text-teal-700 border-white hover:bg-teal-50">
                Open Dashboard
              </Button>
            </Link>
            <Link to="/compare">
              <Button size="large" icon={<SwapOutlined />}
                className="h-12 px-8 text-base font-semibold rounded-lg border-white text-white bg-transparent hover:bg-white/10">
                Compare Products
              </Button>
            </Link>
          </motion.div>

          {/* Stat strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur border border-white/20 px-4 py-3 text-left">
                <div className="text-teal-100 text-xs flex items-center gap-1.5">{s.icon} {s.label}</div>
                <div className="text-white font-semibold mt-0.5">{s.value}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Tag color="teal" className="mb-3 rounded-full px-3 py-0.5 border-none">Platform</Tag>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Everything in one place</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              From raw reviews to a one-click PDF for the next stand-up.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const inner = (
                <Card variant="borderless"
                  className="h-full rounded-2xl shadow-md hover:shadow-teal-100 border border-teal-50 transition-shadow">
                  <div className="flex flex-col gap-3">
                    <div className="w-12 h-12 flex items-center justify-center bg-teal-50 rounded-xl">{f.icon}</div>
                    <Tag color={f.tag === 'New' ? 'gold' : 'teal'} className="w-fit text-xs border-none">{f.tag}</Tag>
                    <h3 className="text-lg font-semibold text-gray-800">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </Card>
              )
              return (
                <motion.div key={f.title} custom={i} variants={fadeUp}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  whileHover={{ y: -6, boxShadow: '0 12px 40px rgba(13,148,136,0.15)' }}
                  className="rounded-2xl"
                >
                  {f.to ? <Link to={f.to}>{inner}</Link> : inner}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="py-24 px-6 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <Tag color="cyan" className="mb-3 rounded-full px-3 py-0.5 border-none">How it works</Tag>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Reviews in. Insights out.</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: '01', t: 'Ingest', d: 'Raw Amazon reviews → MongoDB Atlas. Pre-processing in Python (spaCy).' },
              { num: '02', t: 'Embed', d: 'Sentence-transformers turn every review into a 384-d vector.' },
              { num: '03', t: 'Score', d: 'DistilBERT-SST-2 sentiment + KMeans theme clustering.' },
              { num: '04', t: 'Act', d: 'Search, compare, alerts, downloadable Word reports.' },
            ].map((s, i) => (
              <motion.div key={s.num} custom={i} variants={fadeUp}
                initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {s.num}
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">{s.t}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-teal-900 text-teal-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-white">SRIS</p>
            <p className="text-sm text-teal-300 mt-0.5">Semantic Review Intelligence System</p>
          </div>
          <div className="flex gap-5 text-sm">
            <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link to="/search" className="hover:text-white">Search</Link>
            <Link to="/compare" className="hover:text-white">Compare</Link>
            <Link to="/alerts" className="hover:text-white">Alerts</Link>
            <a href="https://github.com/Vyanaktesh/semantic-review-intelligence"
              target="_blank" rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1">
              <GithubOutlined /> GitHub
            </a>
          </div>
          <p className="text-xs text-teal-400">© 2024 SRIS · React + Node + MongoDB</p>
        </div>
      </footer>
    </div>
  )
}
