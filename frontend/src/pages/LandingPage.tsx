import { Button, Card, Tag } from 'antd'
import { motion, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  SearchOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  BulbOutlined,
  GithubOutlined,
  RocketOutlined,
  ClusterOutlined,
  ShopOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: 'easeOut' as const },
  }),
}

const features = [
  {
    icon: <SearchOutlined className="text-2xl text-brand-700" />,
    title: 'Semantic Search',
    desc: 'Find reviews using natural language queries powered by transformer embeddings—go beyond keyword matching.',
    tag: 'NLP',
    tagColor: 'blue',
  },
  {
    icon: <ThunderboltOutlined className="text-2xl text-brand-700" />,
    title: 'Sentiment Analysis',
    desc: 'Automatically score and classify every review as positive, neutral, or negative in real time.',
    tag: 'AI',
    tagColor: 'blue',
  },
  {
    icon: <ClusterOutlined className="text-2xl text-brand-700" />,
    title: 'Topic Clustering',
    desc: 'Group reviews by latent topics using unsupervised ML to surface what customers talk about most.',
    tag: 'ML',
    tagColor: 'blue',
  },
  {
    icon: <BarChartOutlined className="text-2xl text-brand-700" />,
    title: 'Analytics Dashboard',
    desc: 'Rich visualizations of sentiment trends, cluster distributions, and product performance over time.',
    tag: 'Analytics',
    tagColor: 'gold',
  },
  {
    icon: <BulbOutlined className="text-2xl text-brand-700" />,
    title: 'Anomaly Detection',
    desc: 'Automatically flag unusual review spikes or sentiment drops that may indicate product issues.',
    tag: 'Insights',
    tagColor: 'gold',
  },
  {
    icon: <RocketOutlined className="text-2xl text-brand-700" />,
    title: 'Fast API Backend',
    desc: 'Built on FastAPI + MongoDB Atlas for high-throughput, low-latency review ingestion and querying.',
    tag: 'Backend',
    tagColor: 'blue',
  },
]

const steps = [
  { num: '01', title: 'Ingest Reviews', desc: 'Raw Amazon review data is loaded and preprocessed with cleaning & normalization.' },
  { num: '02', title: 'Embed & Cluster', desc: 'Sentence-transformer models create vector embeddings; KMeans groups them into topics.' },
  { num: '03', title: 'Score Sentiment', desc: 'Each review receives a sentiment score using fine-tuned NLP models.' },
  { num: '04', title: 'Search & Explore', desc: 'Query the index semantically to surface the most relevant reviews for any question.' },
]

const topSuppliers = [
  { name: 'TechSource Global', initials: 'TS', color: '#1D4ED8', category: 'Electronics', verified: true },
  { name: 'Prime Components', initials: 'PC', color: '#7C3AED', category: 'Hardware', verified: true },
  { name: 'RetailHub Inc.',    initials: 'RH', color: '#059669', category: 'Retail',     verified: true },
  { name: 'DataLogix Corp.',   initials: 'DL', color: '#DC2626', category: 'Software',   verified: false },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white py-28 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-2xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
          >
            <span className="inline-flex items-center gap-2 bg-accent-500/20 border border-accent-400/40 text-accent-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wide">
              ✦ Powered by Transformer Embeddings
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6"
          >
            Semantic Review
            <br />
            <span className="text-accent-400">Intelligence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="text-lg text-blue-200 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Understand what customers are really saying. Semantic search, sentiment scoring,
            topic clustering, and anomaly detection — all in one intelligent business platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/search">
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                className="h-12 px-8 text-base font-bold rounded-lg shadow-lg bg-white !text-brand-800 border-white hover:bg-blue-50"
              >
                Try Semantic Search
              </Button>
            </Link>
            <Link to="/suppliers">
              <Button
                size="large"
                icon={<ShopOutlined />}
                className="h-12 px-8 text-base font-bold rounded-lg border-accent-400 !text-accent-300 bg-transparent hover:bg-white/10"
              >
                Browse Suppliers
              </Button>
            </Link>
            <a href="https://github.com/Vyanaktesh/semantic-review-intelligence" target="_blank" rel="noopener noreferrer">
              <Button
                size="large"
                icon={<GithubOutlined />}
                className="h-12 px-8 text-base font-semibold rounded-lg border-white/40 !text-white/80 bg-transparent hover:bg-white/10"
              >
                GitHub
              </Button>
            </a>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-14 flex flex-wrap justify-center gap-8 text-center"
          >
            {[
              { value: '500K+', label: 'Reviews Indexed' },
              { value: '98.2%', label: 'Search Accuracy' },
              { value: '< 80ms', label: 'Avg. Response' },
              { value: '120+', label: 'Verified Suppliers' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-extrabold text-accent-400">{s.value}</p>
                <p className="text-xs text-blue-300 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Tag color="blue" className="mb-3 uppercase tracking-widest text-xs font-semibold px-3 py-1">
              Platform Capabilities
            </Tag>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Built for Business Intelligence</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Everything you need to turn raw customer reviews into actionable insights.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="rounded-2xl"
              >
                <Card
                  bordered={false}
                  className="h-full rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition-all duration-200"
                >
                  <div className="flex flex-col gap-3">
                    <div className="w-11 h-11 flex items-center justify-center bg-brand-50 rounded-xl">
                      {f.icon}
                    </div>
                    <Tag color={f.tagColor} className="w-fit text-xs font-semibold">{f.tag}</Tag>
                    <h3 className="text-base font-bold text-gray-900">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Suppliers Preview ── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
          >
            <div>
              <Tag color="gold" className="mb-3 uppercase tracking-widest text-xs font-semibold px-3 py-1">
                Supplier Network
              </Tag>
              <h2 className="text-3xl font-extrabold text-gray-900">Trusted Supplier Partners</h2>
              <p className="text-gray-500 mt-2 text-base">
                Connect with verified suppliers across every product category.
              </p>
            </div>
            <Link to="/suppliers">
              <Button type="primary" icon={<ArrowRightOutlined />} iconPosition="end" className="rounded-lg h-10 px-6 font-semibold">
                View All Suppliers
              </Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {topSuppliers.map((s, i) => (
              <motion.div
                key={s.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
              >
                <Card
                  bordered={false}
                  className="rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition-all duration-200 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-sm"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.initials}
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1.5">
                        <p className="text-sm font-bold text-gray-900">{s.name}</p>
                        {s.verified && (
                          <SafetyCertificateOutlined className="text-brand-600 text-sm" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{s.category}</p>
                    </div>
                    {s.verified ? (
                      <Tag color="blue" className="text-xs font-medium">
                        <CheckCircleFilled className="mr-1" />Verified
                      </Tag>
                    ) : (
                      <Tag color="default" className="text-xs font-medium">Unverified</Tag>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Tag color="blue" className="mb-3 uppercase tracking-widest text-xs font-semibold px-3 py-1">
              How It Works
            </Tag>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Four Steps to Deep Insights</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              A streamlined pipeline from raw reviews to intelligent, actionable intelligence.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center text-white text-xl font-extrabold shadow-lg">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-6 bg-gradient-to-r from-brand-800 to-brand-700">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to unlock review intelligence?
          </h2>
          <p className="text-blue-200 text-lg mb-8">
            Start searching semantically and discover what your customers truly think.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search">
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                className="h-12 px-8 font-bold rounded-lg bg-accent-500 border-accent-500 hover:bg-accent-600 text-white"
              >
                Start Searching
              </Button>
            </Link>
            <Link to="/suppliers">
              <Button
                size="large"
                icon={<ShopOutlined />}
                className="h-12 px-8 font-bold rounded-lg border-white/40 !text-white bg-transparent hover:bg-white/10"
              >
                Explore Suppliers
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-brand-900 text-blue-200 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xl font-extrabold text-white tracking-tight">SRIS</p>
            <p className="text-sm text-blue-400 mt-1">Semantic Review Intelligence System</p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/search" className="hover:text-white transition-colors">Search</Link>
            <Link to="/suppliers" className="hover:text-white transition-colors">Suppliers</Link>
            <a
              href="https://github.com/Vyanaktesh/semantic-review-intelligence"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <GithubOutlined /> GitHub
            </a>
          </div>
          <p className="text-xs text-blue-500">© 2024 SRIS · Built with ❤️ using React + FastAPI</p>
        </div>
      </footer>
    </div>
  )
}
