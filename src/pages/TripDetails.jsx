import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { refineTripPlan } from '@/lib/gemini'
import { MapPin, Calendar, Users, Wallet, ArrowLeft, Share2, Download, Sparkles, ChevronDown, ChevronUp, Hotel, Backpack, Lightbulb, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

export default function TripDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('itinerary')
  const [expandedDay, setExpandedDay] = useState(0)
  const [refineInput, setRefineInput] = useState('')
  const [refining, setRefining] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => { fetchTrip() }, [id])

  async function fetchTrip() {
    const { data, error } = await supabase.from('trips').select('*').eq('id', id).single()
    if (error) { toast.error('Trip not found'); navigate('/dashboard') }
    else setTrip(data)
    setLoading(false)
  }

  async function handleRefine() {
    if (!refineInput.trim()) return
    setRefining(true)
    try {
      const updated = await refineTripPlan(trip.trip_data, refineInput)
      const { error } = await supabase.from('trips').update({ trip_data: updated }).eq('id', id)
      if (error) throw error
      setTrip(prev => ({ ...prev, trip_data: updated }))
      setRefineInput('')
      toast.success('Trip updated!')
    } catch { toast.error('Failed to refine trip') }
    setRefining(false)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const data = trip.trip_data
      let y = 20

      pdf.setFillColor(8, 8, 8)
      pdf.rect(0, 0, 210, 297, 'F')
      pdf.setTextColor(201, 168, 76)
      pdf.setFontSize(22)
      pdf.setFont('helvetica', 'bold')
      pdf.text(data.title || `Trip to ${trip.destination}`, 20, y)
      y += 10
      pdf.setTextColor(180, 170, 150)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(data.summary || '', 20, y, { maxWidth: 170 })
      y += 15
      pdf.setDrawColor(201, 168, 76)
      pdf.setLineWidth(0.3)
      pdf.line(20, y, 190, y)
      y += 10
      pdf.setTextColor(201, 168, 76)
      pdf.setFontSize(9)
      pdf.text(`FROM: ${trip.source}   TO: ${trip.destination}   TRAVELERS: ${trip.travelers}   BUDGET: ₹${trip.budget?.toLocaleString('en-IN')}`, 20, y)
      y += 15
      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.text('ITINERARY', 20, y)
      y += 8
      data.itinerary?.forEach(day => {
        if (y > 260) { pdf.addPage(); pdf.setFillColor(8, 8, 8); pdf.rect(0, 0, 210, 297, 'F'); y = 20 }
        pdf.setTextColor(201, 168, 76)
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`Day ${day.day} — ${day.title}`, 20, y)
        y += 6
        day.activities?.forEach(act => {
          if (y > 270) { pdf.addPage(); pdf.setFillColor(8, 8, 8); pdf.rect(0, 0, 210, 297, 'F'); y = 20 }
          pdf.setTextColor(180, 170, 150)
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.text(`${act.time}  ${act.activity} — ${act.location}`, 25, y)
          y += 5
        })
        y += 4
      })
      if (y > 240) { pdf.addPage(); pdf.setFillColor(8, 8, 8); pdf.rect(0, 0, 210, 297, 'F'); y = 20 }
      pdf.setTextColor(201, 168, 76)
      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.text('BUDGET BREAKDOWN', 20, y)
      y += 8
      const bd = data.budgetBreakdown
      if (bd) {
        Object.entries(bd).forEach(([key, val]) => {
          if (key === 'total') return
          pdf.setTextColor(180, 170, 150)
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.text(`${key.charAt(0).toUpperCase() + key.slice(1)}: ₹${val?.toLocaleString('en-IN')}`, 25, y)
          y += 5
        })
        pdf.setTextColor(201, 168, 76)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`Total: ₹${bd.total?.toLocaleString('en-IN')}`, 25, y)
        y += 10
      }
      if (data.packingList?.length) {
        if (y > 240) { pdf.addPage(); pdf.setFillColor(8, 8, 8); pdf.rect(0, 0, 210, 297, 'F'); y = 20 }
        pdf.setTextColor(201, 168, 76)
        pdf.setFontSize(13)
        pdf.setFont('helvetica', 'bold')
        pdf.text('PACKING LIST', 20, y)
        y += 8
        data.packingList.forEach(item => {
          pdf.setTextColor(180, 170, 150)
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.text(`• ${item}`, 25, y)
          y += 5
        })
      }
      pdf.save(`${trip.destination}-trip-plan.pdf`)
      toast.success('PDF downloaded!')
    } catch (err) { console.error(err); toast.error('Export failed') }
    setExporting(false)
  }


  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--color-gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!trip) return null
  const data = trip.trip_data

  const tabs = [
    { id: 'itinerary', label: 'Itinerary', icon: Calendar },
    { id: 'hotels', label: 'Hotels', icon: Hotel },
    { id: 'budget', label: 'Budget', icon: Wallet },
    { id: 'packing', label: 'Packing', icon: Backpack },
    { id: 'tips', label: 'Tips', icon: Lightbulb },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-cream)' }}>

      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)',
        background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50, flexWrap: 'wrap', gap: '0.75rem'
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 4,
            background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <MapPin size={16} style={{ color: 'var(--color-bg)' }} />
          </div>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-gold)', letterSpacing: '0.2em' }}>TRAVAULT</span>
        </div>

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'transparent', border: '1px solid var(--color-border)',
              color: 'var(--color-cream-muted)', padding: '0.4rem 0.75rem',
              fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-gold)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-cream-muted)' }}
          >
            <ArrowLeft size={13} /> Dashboard
          </button>
          <button onClick={handleShare}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'transparent', border: '1px solid var(--color-border)',
              color: 'var(--color-cream-muted)', padding: '0.4rem 0.75rem',
              fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-gold)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-cream-muted)' }}
          >
            <Share2 size={13} /> Share
          </button>
          <button onClick={handleExport} disabled={exporting}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
              border: 'none', color: 'var(--color-bg)', padding: '0.4rem 0.75rem',
              fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600
            }}
          >
            <Download size={13} /> {exporting ? 'Exporting...' : 'PDF'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Trip Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <MapPin size={14} style={{ color: 'var(--color-gold)' }} />
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--color-gold)' }}>
              {trip.source} → {trip.destination}
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 300, marginBottom: '1rem' }}>
            {data.title || `Trip to ${trip.destination}`}
          </h1>
          <p style={{ fontSize: '0.9rem', fontWeight: 300, lineHeight: 1.8, color: 'var(--color-cream-muted)', marginBottom: '1.5rem' }}>
            {data.summary}
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { icon: Calendar, label: `${formatDate(trip.start_date)} — ${formatDate(trip.end_date)}` },
              { icon: Users, label: `${trip.travelers} Travelers` },
              { icon: Wallet, label: `₹${trip.budget?.toLocaleString('en-IN')} Budget` },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <item.icon size={13} style={{ color: 'var(--color-gold)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-cream-muted)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div style={{ height: 1, background: 'linear-gradient(to right, var(--color-border), transparent)', marginBottom: '2rem' }} />

        {/* Tabs — scrollable on mobile */}
        <div style={{
          display: 'flex', marginBottom: '2rem',
          borderBottom: '1px solid var(--color-border)',
          overflowX: 'auto', WebkitOverflowScrolling: 'touch'
        }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.75rem 1rem', fontSize: '0.7rem', letterSpacing: '0.1em',
                textTransform: 'uppercase', cursor: 'pointer', background: 'transparent', border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-gold)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--color-gold)' : 'var(--color-cream-muted)',
                transition: 'all 0.2s', marginBottom: '-1px', whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* ITINERARY */}
            {activeTab === 'itinerary' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--color-border)' }}>
                {data.itinerary?.map((day, i) => (
                  <div key={i} style={{ background: 'var(--color-bg)' }}>
                    <button
                      onClick={() => setExpandedDay(expandedDay === i ? -1 : i)}
                      style={{
                        width: '100%', padding: '1.25rem 1rem', display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'var(--color-cream)', transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-gold)', minWidth: 40 }}>
                          Day {day.day}
                        </span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 400, textAlign: 'left' }}>{day.title}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-cream-subtle)' }}>{day.date}</span>
                      </div>
                      {expandedDay === i
                        ? <ChevronUp size={16} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
                        : <ChevronDown size={16} style={{ color: 'var(--color-cream-subtle)', flexShrink: 0 }} />}
                    </button>

                    <AnimatePresence>
                      {expandedDay === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '0 1rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
                            {day.activities?.map((act, j) => (
                              <div key={j} style={{
                                display: 'flex', gap: '1rem', padding: '1rem 0',
                                borderBottom: j < day.activities.length - 1 ? '1px solid rgba(201,168,76,0.08)' : 'none',
                                flexWrap: 'wrap'
                              }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-gold)', minWidth: 65, paddingTop: 2 }}>{act.time}</span>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.25rem', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{act.activity}</span>
                                    {act.cost > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--color-gold)', flexShrink: 0 }}>₹{act.cost?.toLocaleString('en-IN')}</span>}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                                    <MapPin size={11} style={{ color: 'var(--color-cream-subtle)' }} />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-cream-muted)' }}>{act.location}</span>
                                  </div>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--color-cream-muted)', lineHeight: 1.6, fontWeight: 300 }}>{act.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}

            {/* HOTELS */}
            {activeTab === 'hotels' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1px', background: 'var(--color-border)' }}>
                {data.hotels?.map((hotel, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    style={{ background: 'var(--color-bg)', padding: '1.5rem' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 500, paddingRight: '0.5rem' }}>{hotel.name}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-gold)', fontWeight: 600, flexShrink: 0 }}>★ {hotel.rating}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                      <MapPin size={11} style={{ color: 'var(--color-cream-subtle)' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-cream-muted)' }}>{hotel.area}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-cream-subtle)', marginBottom: '1rem' }}>{hotel.distanceFromCenter}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                      {hotel.amenities?.map((a, j) => (
                        <span key={j} style={{
                          fontSize: '0.65rem', padding: '0.2rem 0.6rem', textTransform: 'uppercase',
                          letterSpacing: '0.1em', border: '1px solid var(--color-border)', color: 'var(--color-cream-muted)'
                        }}>{a}</span>
                      ))}
                    </div>
                    <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-cream-subtle)' }}>per night</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-gold)' }}>₹{hotel.pricePerNight?.toLocaleString('en-IN')}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* BUDGET */}
            {activeTab === 'budget' && (
              <div style={{ maxWidth: 500 }}>
                {data.budgetBreakdown && Object.entries(data.budgetBreakdown).map(([key, val], i) => {
                  const isTotal = key === 'total'
                  const percentage = isTotal ? 100 : Math.round((val / data.budgetBreakdown.total) * 100)
                  return (
                    <motion.div key={key}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      style={{
                        padding: '1.25rem 0', borderBottom: '1px solid var(--color-border)',
                        borderTop: isTotal ? '1px solid var(--color-gold)' : 'none',
                        marginTop: isTotal ? '0.5rem' : 0
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isTotal ? 0 : '0.5rem' }}>
                        <span style={{ fontSize: isTotal ? '0.9rem' : '0.8rem', fontWeight: isTotal ? 600 : 400, textTransform: 'capitalize', color: isTotal ? 'var(--color-gold)' : 'var(--color-cream)' }}>
                          {key}
                        </span>
                        <span style={{ fontSize: isTotal ? '1.1rem' : '0.9rem', fontWeight: isTotal ? 600 : 400, color: isTotal ? 'var(--color-gold)' : 'var(--color-cream)' }}>
                          ₹{val?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {!isTotal && (
                        <div style={{ height: 2, background: 'var(--color-border)', borderRadius: 1 }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: i * 0.08 + 0.3, duration: 0.6 }}
                            style={{ height: '100%', background: 'linear-gradient(to right, var(--color-gold-dark), var(--color-gold))', borderRadius: 1 }}
                          />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* PACKING */}
            {activeTab === 'packing' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1px', background: 'var(--color-border)' }}>
                {data.packingList?.map((item, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ background: 'var(--color-bg)', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg)'}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-gold)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 300 }}>{item}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* TIPS */}
            {activeTab === 'tips' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--color-border)' }}>
                {data.tips?.map((tip, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    style={{ background: 'var(--color-bg)', padding: '1.25rem 1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg)'}
                  >
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-gold)', minWidth: 24, paddingTop: 3, fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: 300, lineHeight: 1.7, color: 'var(--color-cream-muted)' }}>{tip}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* AI Refine */}
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Sparkles size={14} style={{ color: 'var(--color-gold)' }} />
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--color-gold)' }}>Refine with AI</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-cream-muted)', marginBottom: '1rem', fontWeight: 300 }}>
            Not satisfied? Ask AI to tweak your plan.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              value={refineInput}
              onChange={e => setRefineInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRefine()}
              placeholder='e.g. "Make it more budget friendly"'
              style={{
                flex: 1, minWidth: 200, padding: '0.75rem 1rem', fontSize: '0.85rem',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
                color: 'var(--color-cream)', outline: 'none', fontFamily: 'inherit'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-gold)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
            <button onClick={handleRefine} disabled={refining || !refineInput.trim()}
              style={{
                padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
                border: 'none', color: 'var(--color-bg)', cursor: refining ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem', fontWeight: 600, opacity: refining ? 0.6 : 1
              }}
            >
              {refining
                ? <div style={{ width: 14, height: 14, border: '2px solid var(--color-bg)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <><Send size={13} /> Refine</>
              }
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}   