import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-8 py-20">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -inset-[10px] opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(226, 0, 116, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(226, 0, 116, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, rgba(226, 0, 116, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(226, 0, 116, 0.3) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Logo/Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">T</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">T-Mobile Intelligence</span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 text-5xl md:text-7xl font-bold tracking-tight"
        >
          Customer Happiness{' '}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-accent to-primary">
            Intelligence
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12 text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto"
        >
          Real-time social media monitoring, AI-powered sentiment analysis, and intelligent outage detection
          to keep your network running smoothly.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link to="/dashboard">
            <button className="group relative inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-lg transition-all hover:scale-105">
              View Dashboard
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
          <Link to="/network-map">
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-card hover:bg-secondary border border-border text-foreground rounded-lg font-semibold text-lg transition-all hover:scale-105">
              Explore Network
            </button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="p-6 rounded-xl bg-card border border-border backdrop-blur">
            <div className="text-4xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Real-time Monitoring</div>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border backdrop-blur">
            <div className="text-4xl font-bold text-primary mb-2">3</div>
            <div className="text-sm text-muted-foreground">Data Sources Integrated</div>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border backdrop-blur">
            <div className="text-4xl font-bold text-primary mb-2">AI</div>
            <div className="text-sm text-muted-foreground">Powered Insights</div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-sm">Scroll to explore</span>
          <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  )
}

