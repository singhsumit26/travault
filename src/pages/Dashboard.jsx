import { useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Plus, MapPin, Calendar, Users, Trash2, LogOut, Compass } from 'lucide-react'

export default function Dashboard() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchTrips()
  }, [user])

  async function fetchTrips() {
    setLoading(true)
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setTrips(data || [])
    setLoading(false)
  }

  async function deleteTrip(id, e) {
    e.stopPropagation()
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (!error) setTrips(prev => prev.filter(t => t.id !== id))
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-cream)' }}>

      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => navigate('/')}>
          <div style={{
            width: 32, height: 32, borderRadius: 4,
            background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MapPin size={16} style={{ color: 'var(--color-bg)' }} />
          </div>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-gold)', letterSpacing: '0.2em' }}>
            TRAVAULT
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-cream-muted)' }}>
            {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </span>
          <button
            onClick={() => signOut(() => navigate('/'))}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 1rem', fontSize: '0.75rem', letterSpacing: '0.1em',
              textTransform: 'uppercase', background: 'transparent', cursor: 'pointer',
              border: '1px solid var(--color-border)', color: 'var(--color-cream-muted)',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-gold)'
              e.currentTarget.style.color = 'var(--color-gold)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.color = 'var(--color-cream-muted)'
            }}
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 2rem' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '3rem' }}
        >
          <div>
            <p style={{ fontSize: '0.7rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '0.5rem' }}>
              Welcome back
            </p>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 300 }}>
              {user?.firstName ? `${user.firstName}'s Trips` : 'Your Trips'}
            </h1>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/plan')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', fontSize: '0.75rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', border: 'none',
              background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
              color: 'var(--color-bg)'
            }}
          >
            <Plus size={15} />
            New Trip
          </motion.button>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--color-border)' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ background: 'var(--color-bg)', padding: '2rem', height: 200 }}>
                <div style={{ height: 12, width: '60%', background: 'rgba(201,168,76,0.1)', borderRadius: 4, marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: 8, width: '40%', background: 'rgba(201,168,76,0.07)', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '6rem 2rem', border: '1px solid var(--color-border)' }}
          >
            <Compass size={40} style={{ color: 'var(--color-gold)', margin: '0 auto 1.5rem', opacity: 0.6 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 300, marginBottom: '0.5rem' }}>No trips yet</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-cream-muted)', marginBottom: '2rem' }}>
              Start planning your first adventure
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/plan')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 2rem', fontSize: '0.75rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', border: 'none',
                background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
                color: 'var(--color-bg)'
              }}
            >
              <Plus size={15} />
              Plan Your First Trip
            </motion.button>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1px', background: 'var(--color-border)' }}>
            {trips.map((trip, i) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate(`/trip/${trip.id}`)}
                style={{
                  background: 'var(--color-bg)', padding: '2rem', cursor: 'pointer',
                  transition: 'background 0.3s', position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg)'}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => deleteTrip(trip.id, e)}
                  style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--color-cream-subtle)', padding: '0.25rem',
                    transition: 'color 0.3s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-cream-subtle)'}
                >
                  <Trash2 size={15} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <MapPin size={14} style={{ color: 'var(--color-gold)' }} />
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-gold)' }}>
                    {trip.source} → {trip.destination}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 400, marginBottom: '1.5rem', paddingRight: '2rem' }}>
                  {trip.title || `Trip to ${trip.destination}`}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={12} style={{ color: 'var(--color-cream-subtle)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-cream-muted)' }}>
                      {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={12} style={{ color: 'var(--color-cream-subtle)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-cream-muted)' }}>
                      {trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}
                    </span>
                  </div>
                </div>

                <div style={{
                  marginTop: '1.5rem', paddingTop: '1.5rem',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-cream-subtle)' }}>
                    ₹{trip.budget?.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-gold)' }}>
                    View Plan →
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}