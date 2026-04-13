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
} from '@ant-design/icons'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' as const },
  }),
}

const features = [
  {
    icon: <SearchOutlined className="text-3xl text-teal-500" />,
    title: 'Semantic Search',
    desc: 'Find reviews using natural language queries powered by transformer embeddings—go beyond keyword matching.',
    tag: 'NLP',
  },
  {
    icon: <ThunderboltOutlined className="text-3xl text-teal-500" />,
    title: 'Sentiment Analysis',
    desc: 'Automatically score and classify every review as positive, neutral, or negative in real time.',
    tag: 'AI',
  },
  {
    icon: <ClusterOutlined className="text-3xl text-teal-500" />,
    title: 'Topic Clustering',
    desc: 'Group reviews by latent topics using unsupervised ML to surface what customers talk about most.',
    tag: 'ML',
  },
  {
    icon: <BarChartOutlined className="text-3xl text-teal-500" />,
    title: 'Analytics Dashboard',
    desc: 'Rich visualizations of sentiment trends, cluster distributions, and product performance over time.',
    tag: 'Analytics',
  },
  {
    icon: <BulbOutlined className="text-3xl text-teal-500" />,
    title: 'Anomaly Detection',
    desc: 'Automatically flag unusual review spikes or sentiment drops that may indicate product issues.',
    tag: 'Insights',
  },
  {
    icon: <RocketOutlined className="text-3xl text-teal-500" />,
    title: 'Fast API Backend',
    desc: 'Built on FastAPI + MongoDB Atlas for high-throughput, low-latency review ingestion and querying.',
    tag: 'Backend',
  },
]

const steps = [
  { num: '01', title: 'Ingest Reviews', desc: 'Raw Amazon review data is loaded and preprocessed with cleaning & normalization.' },
  { num: '02', title: 'Embed & Cluster', desc: 'Sentence-transformer models create vector embeddings; KMeans groups them into topics.' },
  { num: '03', title: 'Score Sentiment', desc: 'Each review receives a sentiment score using fine-tuned NLP models.' },
  { num: '04', title: 'Search & Explore', desc: 'Query the index semantically to surface the most relevant reviews for any question.' },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-500 to-teal-300 text-white py-28 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Tag color="gold" className="mb-4 text-sm px-3 py-1 rounded-full font-medium">
              ✨ Powered by Transformer Embeddings
            </Tag>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6 drop-shadow-lg"
          >
            Semantic Review
            <br />
            <span className="text-white/85">Intelligence</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-xl text-teal-50 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Understand what customers are really saying. Semantic search, sentiment scoring,
            topic clustering, and anomaly detection—all in one intelligent platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/search">
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                className="h-12 px-8 text-base font-semibold rounded-lg shadow-lg bg-white text-teal-700 border-white hover:bg-teal-50"
              >
                Try Semantic Search
              </Button>
            </Link>
            <a href="https://github.com/Vyanaktesh/semantic-review-intelligence" target="_blank" rel="noopener noreferrer">
              <Button
                size="large"
                icon={<GithubOutlined />}
                className="h-12 px-8 text-base font-semibold rounded-lg border-white text-white bg-transparent hover:bg-white/10"
              >
                View on GitHub
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Main Features</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Everything you need to turn raw customer reviews into actionable business intelligence.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -6, boxShadow: '0 12px 40px rgba(13,148,136,0.15)' }}
                className="rounded-2xl"
              >
                <Card
                  bordered={false}
                  className="h-full rounded-2xl shadow-md hover:shadow-teal-100 border border-teal-50 transition-shadow"
                >
                  <div className="flex flex-col gap-3">
                    <div className="w-12 h-12 flex items-center justify-center bg-teal-50 rounded-xl">
                      {f.icon}
                    </div>
                    <Tag color="teal" className="w-fit text-xs">{f.tag}</Tag>
                    <h3 className="text-lg font-semibold text-gray-800">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              A four-step pipeline that turns raw reviews into deep insights.
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {step.num}
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal-900 text-teal-100 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xl font-bold text-white">SRIS</p>
            <p className="text-sm text-teal-300 mt-1">Semantic Review Intelligence System</p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/search" className="hover:text-white transition-colors">Search</Link>
            <a
              href="https://github.com/Vyanaktesh/semantic-review-intelligence"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <GithubOutlined /> GitHub
            </a>
          </div>
          <p className="text-xs text-teal-400">© 2024 SRIS · Built with ❤️ using React + FastAPI</p>
        </div>
      </footer>
    </div>
  )
}
