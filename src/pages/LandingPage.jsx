import { motion } from 'framer-motion'
import { useAuth, SignInButton } from '@clerk/clerk-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MapPin, Sparkles, Globe, Shield, Zap, ArrowRight } from 'lucide-react'

const destinations = ['Manali', 'Goa', 'Kerala', 'Rajasthan', 'Ladakh', 'Meghalaya', 'Coorg', 'Rishikesh']

const features = [
  { icon: Sparkles, title: 'AI-Powered Plans', description: 'Gemini AI crafts personalized day-by-day itineraries tailored to your style and budget.' },
  { icon: MapPin, title: 'Smart Hotel Picks', description: 'Hotels ranked by proximity to tourist spots, ratings, and your budget range.' },
  { icon: Globe, title: 'Interactive Maps', description: 'Visualize your journey with live route mapping between source and destination.' },
  { icon: Zap, title: 'Instant Generation', description: 'Get a complete trip plan in seconds, not hours of manual research.' },
  { icon: Shield, title: 'Save & Share', description: 'Save all your trips and share them with friends via a simple link.' },
  { icon: Sparkles, title: 'AI Refinement', description: 'Not happy with the plan? Ask AI to tweak it — more budget friendly, more adventure, anything.' },
]

function StatsSection() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function fetchStats() {
      const { count: tripCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
      const { data: destinations } = await supabase.from('trips').select('destination')
      const uniqueDestinations = new Set(destinations?.map(t => t.destination) || []).size
      const { data: users } = await supabase.from('trips').select('user_id')
      const uniqueUsers = new Set(users?.map(t => t.user_id) || []).size
      if (tripCount > 0) {
        setStats([
          { label: 'Trips Planned', value: tripCount },
          { label: 'Destinations', value: uniqueDestinations },
          { label: 'Travelers', value: uniqueUsers },
        ])
      }
    }
    fetchStats()
  }, [])

  if (!stats) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
      style={{ display: 'flex', maxWidth: 600, width: '100%', marginTop: '4rem', position: 'relative', zIndex: 1 }}
    >
      {stats.map((stat, i) => (
        <div key={i} style={{
          flex: 1, textAlign: 'center', padding: '1.5rem 0.5rem',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
          borderLeft: '1px solid var(--color-border)',
          borderRight: i === 2 ? '1px solid var(--color-border)' : 'none',
        }}>
          <div style={{ fontSize: 'clamp(1.2rem, 4vw, 1.75rem)', fontWeight: 600, color: 'var(--color-gold)', marginBottom: 4 }}>{stat.value}</div>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-cream-subtle)' }}>{stat.label}</div>
        </div>
      ))}
    </motion.div>
  )
}

export default function LandingPage() {
  const { isSignedIn } = useAuth()
  const navigate = useNavigate()
  const [currentDest, setCurrentDest] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDest(prev => (prev + 1) % destinations.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const heroFontSize = 'clamp(1.8rem, 6vw, 5rem)'
  const heroContainerHeight = 'clamp(2.4rem, 7.5vw, 6rem)'

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-cream)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 4, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MapPin size={16} style={{ color: 'var(--color-bg)' }} />
          </div>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-gold)', letterSpacing: '0.2em' }}>
            TRAVAULT
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          {isSignedIn ? (
            <button onClick={() => navigate('/dashboard')} style={{
              padding: '0.4rem 1rem', fontSize: '0.7rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', background: 'transparent', cursor: 'pointer',
              border: '1px solid var(--color-border-hover)', color: 'var(--color-gold)', transition: 'background 0.3s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Dashboard
            </button>
          ) : (
            <SignInButton mode="modal">
              <button style={{
                padding: '0.4rem 1rem', fontSize: '0.7rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', background: 'transparent', cursor: 'pointer',
                border: '1px solid var(--color-border-hover)', color: 'var(--color-gold)', transition: 'background 0.3s'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Sign In
              </button>
            </SignInButton>
          )}
        </motion.div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '6rem 1.5rem 4rem', position: 'relative'
      }}>
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)'
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          style={{ textAlign: 'center', maxWidth: 800, width: '100%', position: 'relative', zIndex: 1 }}
        >
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '2rem' }}
          >
            AI-Powered Travel Planning
          </motion.p>

          <h1 style={{
            fontSize: heroFontSize,
            fontWeight: 300, lineHeight: 1.15, marginBottom: '0.5rem', letterSpacing: '-0.02em'
          }}>
            Plan your trip to
          </h1>

          <div style={{ height: heroContainerHeight, overflow: 'hidden', marginBottom: '2rem' }}>
            <motion.h1
              key={currentDest}
              initial={{ y: 96, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                fontSize: heroFontSize,
                fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-light), var(--color-gold))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}
            >
              {destinations[currentDest]}
            </motion.h1>
          </div>

          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.5 }}
            style={{
              width: 80, height: 1, margin: '0 auto 2rem',
              background: 'linear-gradient(to right, transparent, var(--color-gold), transparent)'
            }}
          />

          <p style={{
            fontSize: 'clamp(0.85rem, 2vw, 1rem)', fontWeight: 300, lineHeight: 1.8,
            color: 'var(--color-cream-muted)', maxWidth: 480, margin: '0 auto 2.5rem'
          }}>
            Tell us where you want to go. Travault builds your perfect itinerary,
            finds the best hotels, and plans every detail — in seconds.
          </p>

          {isSignedIn ? (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.875rem 2rem', fontSize: '0.75rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
                color: 'var(--color-bg)', border: 'none'
              }}
            >
              Go to Dashboard <ArrowRight size={16} />
            </motion.button>
          ) : (
            <SignInButton mode="modal">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.875rem 2rem', fontSize: '0.75rem', letterSpacing: '0.15em',
                  textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer',
                  background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
                  color: 'var(--color-bg)', border: 'none'
                }}
              >
                Begin Your Journey <ArrowRight size={16} />
              </motion.button>
            </SignInButton>
          )}
        </motion.div>

        <StatsSection />
      </section>

      {/* Divider */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--color-border), transparent)' }} />
      </div>

      {/* Features */}
      <section style={{ padding: 'clamp(3rem, 8vw, 6rem) 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ marginBottom: '3rem' }}
        >
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '1rem' }}>
            Why Travault
          </p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 300 }}>Everything you need to travel smarter</h2>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          border: '1px solid var(--color-border)'
        }}>
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{
                padding: '1.75rem', background: 'var(--color-bg)',
                transition: 'background 0.3s', cursor: 'default',
                borderRight: '1px solid var(--color-border)',
                borderBottom: '1px solid var(--color-border)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg)'}
            >
              <feature.icon size={18} style={{ color: 'var(--color-gold)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.5rem' }}>{feature.title}</h3>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.7, fontWeight: 300, color: 'var(--color-cream-muted)' }}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--color-border), transparent)' }} />
      </div>

      {/* CTA */}
      <section style={{ padding: 'clamp(3rem, 8vw, 6rem) 1.5rem', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '1.5rem' }}>
            Get Started
          </p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', fontWeight: 300, marginBottom: '1rem' }}>
            Ready to explore the world?
          </h2>
          <p style={{ fontSize: '0.85rem', fontWeight: 300, color: 'var(--color-cream-subtle)', marginBottom: '2.5rem' }}>
            Join thousands of travelers who plan smarter with Travault.
          </p>
          {isSignedIn ? (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.875rem 2rem', fontSize: '0.75rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
                color: 'var(--color-bg)', border: 'none'
              }}
            >
              Go to Dashboard <ArrowRight size={16} />
            </motion.button>
          ) : (
            <SignInButton mode="modal">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.875rem 2rem', fontSize: '0.75rem', letterSpacing: '0.15em',
                  textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer',
                  background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
                  color: 'var(--color-bg)', border: 'none'
                }}
              >
                Begin Your Journey <ArrowRight size={16} />
              </motion.button>
            </SignInButton>
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: 20, height: 20, borderRadius: 3,
            background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MapPin size={11} style={{ color: 'var(--color-bg)' }} />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-gold)', letterSpacing: '0.2em' }}>TRAVAULT</span>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-cream-subtle)', letterSpacing: '0.1em' }}>
          AI TRAVEL PLANNING — CRAFTED WITH CARE
        </p>
      </footer>
    </div>
  )
}