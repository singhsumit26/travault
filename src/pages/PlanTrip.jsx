import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '@/lib/supabase'
import { generateTripPlan, generateSurpriseDestination } from '@/lib/gemini'
import { MapPin, Calendar, Users, Wallet, Shuffle, Sparkles, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

async function geocode(city) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`)
  const data = await res.json()
  if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
  return null
}

async function searchPlaces(query) {
  if (!query || query.length < 2) return []
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`)
  const data = await res.json()
  return data.map(p => ({
    label: p.display_name.split(',').slice(0, 3).join(', '),
    lat: parseFloat(p.lat),
    lon: parseFloat(p.lon)
  }))
}

function PlaceInput({ label, icon, name, value, onChange, onSelect, placeholder }) {
  const [suggestions, setSuggestions] = useState([])
  const [showSugg, setShowSugg] = useState(false)
  const timerRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSugg(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(e) {
    onChange(e)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const results = await searchPlaces(e.target.value)
      setSuggestions(results)
      setShowSugg(results.length > 0)
    }, 400)
  }

  function handleSelect(s) {
    onSelect(name, s.label.split(',')[0].trim(), [s.lat, s.lon])
    setSuggestions([])
    setShowSugg(false)
  }

  const labelStyle = {
    fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em',
    color: 'var(--color-gold)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 4
  }

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', fontSize: '0.9rem',
    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
    color: 'var(--color-cream)', outline: 'none', transition: 'border-color 0.3s', fontFamily: 'inherit'
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <label style={labelStyle}>{icon}{label}</label>
      <input
        name={name} value={value} onChange={handleChange}
        placeholder={placeholder} style={inputStyle}
        onFocus={e => { e.target.style.borderColor = 'var(--color-gold)'; if (suggestions.length) setShowSugg(true) }}
        onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
        autoComplete="off"
      />
      <AnimatePresence>
        {showSugg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
              background: '#111', border: '1px solid var(--color-border)',
              borderTop: 'none', maxHeight: 200, overflowY: 'auto'
            }}
          >
            {suggestions.map((s, i) => (
              <div key={i} onMouseDown={() => handleSelect(s)}
                style={{
                  padding: '0.6rem 1rem', fontSize: '0.8rem', cursor: 'pointer',
                  color: 'var(--color-cream-muted)', borderBottom: '1px solid var(--color-border)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; e.currentTarget.style.color = 'var(--color-cream)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-cream-muted)' }}
              >
                <MapPin size={11} style={{ display: 'inline', marginRight: 6, color: 'var(--color-gold)' }} />
                {s.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PlanTrip() {
  const { user } = useUser()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    source: '', destination: '', startDate: '', endDate: '',
    budget: '', travelers: 1, preferences: ''
  })
  const [sourceCoords, setSourceCoords] = useState(null)
  const [destCoords, setDestCoords] = useState(null)
  const [distance, setDistance] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [surpriseLoading, setSurpriseLoading] = useState(false)

  useEffect(() => {
    if (sourceCoords && destCoords) {
      const R = 6371
      const dLat = (destCoords[0] - sourceCoords[0]) * Math.PI / 180
      const dLon = (destCoords[1] - sourceCoords[1]) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(sourceCoords[0] * Math.PI / 180) * Math.cos(destCoords[0] * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2
      setDistance(Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))))
    } else {
      setDistance(null)
    }
  }, [sourceCoords, destCoords])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSelect(name, value, coords) {
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'source') setSourceCoords(coords)
    if (name === 'destination') setDestCoords(coords)
  }

  async function handleSurprise() {
    if (!form.budget || !form.startDate || !form.endDate) {
      toast.error('Please fill in budget and dates first')
      return
    }
    setSurpriseLoading(true)
    try {
      const result = await generateSurpriseDestination(form.budget, form.travelers, form.startDate, form.endDate)
      const coords = await geocode(result.destination)
      setForm(prev => ({ ...prev, destination: result.destination }))
      if (coords) setDestCoords(coords)
      toast.success(`✨ How about ${result.destination}? ${result.reason}`)
    } catch {
      toast.error('Could not generate suggestion')
    }
    setSurpriseLoading(false)
  }

  async function handleSubmit() {
    if (!form.source || !form.destination || !form.startDate || !form.endDate || !form.budget) {
      toast.error('Please fill in all required fields')
      return
    }
    setGenerating(true)
    try {
      const tripData = await generateTripPlan(form)
      const { data, error } = await supabase.from('trips').insert({
        user_id: user.id,
        title: tripData.title,
        source: form.source,
        destination: form.destination,
        start_date: form.startDate,
        end_date: form.endDate,
        budget: parseFloat(form.budget),
        travelers: parseInt(form.travelers),
        trip_data: tripData
      }).select().single()
      if (error) throw error
      toast.success('Trip planned!')
      navigate(`/trip/${data.id}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate trip. Check console for details.')
    }
    setGenerating(false)
  }

  const mapCenter = sourceCoords && destCoords
    ? [(sourceCoords[0] + destCoords[0]) / 2, (sourceCoords[1] + destCoords[1]) / 2]
    : sourceCoords || destCoords || [22.5937, 82.9629]

  const mapZoom = sourceCoords && destCoords ? 5 : sourceCoords || destCoords ? 7 : 4

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', fontSize: '0.9rem',
    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
    color: 'var(--color-cream)', outline: 'none', transition: 'border-color 0.3s', fontFamily: 'inherit'
  }

  const labelStyle = {
    fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em',
    color: 'var(--color-gold)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 4
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-cream)' }}>

      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2rem', borderBottom: '1px solid var(--color-border)',
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
          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-gold)', letterSpacing: '0.2em' }}>TRAVAULT</span>
        </div>
        <button onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'transparent', border: '1px solid var(--color-border)',
            color: 'var(--color-cream-muted)', padding: '0.4rem 1rem',
            fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-gold)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-cream-muted)' }}
        >
          <ArrowLeft size={13} /> Dashboard
        </button>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 65px)' }}>

        {/* LEFT — Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          style={{ padding: '3rem 2.5rem', borderRight: '1px solid var(--color-border)', overflowY: 'auto' }}
        >
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '0.75rem' }}>New Journey</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '2.5rem' }}>Plan your trip</h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <PlaceInput
              label="From" name="source" value={form.source}
              icon={<MapPin size={10} />}
              placeholder="e.g. Delhi"
              onChange={handleChange}
              onSelect={handleSelect}
            />

            {/* Destination with surprise button */}
            <div>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={10} /> To
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <PlaceInput
                    label="" name="destination" value={form.destination}
                    icon={null}
                    placeholder="e.g. Manali"
                    onChange={handleChange}
                    onSelect={handleSelect}
                  />
                </div>
                <button onClick={handleSurprise} disabled={surpriseLoading} title="Surprise me!"
                  style={{
                    padding: '0 1rem', background: 'rgba(201,168,76,0.08)',
                    border: '1px solid var(--color-border)', color: 'var(--color-gold)',
                    cursor: 'pointer', alignSelf: 'flex-end', height: '42px', flexShrink: 0
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
                >
                  {surpriseLoading
                    ? <div style={{ width: 14, height: 14, border: '2px solid var(--color-gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    : <Shuffle size={14} />}
                </button>
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}><Calendar size={10} />Start Date</label>
                <input type="date" name="startDate" value={form.startDate} onChange={handleChange}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>
              <div>
                <label style={labelStyle}><Calendar size={10} />End Date</label>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>
            </div>

            {/* Budget & Travelers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}><Wallet size={10} />Budget (₹)</label>
                <input type="number" name="budget" value={form.budget} onChange={handleChange}
                  placeholder="e.g. 20000" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--color-gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>
              <div>
                <label style={labelStyle}><Users size={10} />Travelers</label>
                <input type="number" name="travelers" value={form.travelers} onChange={handleChange}
                  min={1} max={20} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--color-gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>
            </div>

            {/* Preferences */}
            <div>
              <label style={labelStyle}><Sparkles size={10} />Preferences (optional)</label>
              <textarea name="preferences" value={form.preferences} onChange={handleChange}
                placeholder="e.g. adventure activities, vegetarian food, budget stays..."
                rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = 'var(--color-gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Distance badge */}
            <AnimatePresence>
              {distance && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    padding: '0.75rem 1rem', border: '1px solid var(--color-border)',
                    background: 'rgba(201,168,76,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  <MapPin size={13} style={{ color: 'var(--color-gold)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-cream-muted)' }}>
                    {form.source} → {form.destination} is approximately{' '}
                    <span style={{ color: 'var(--color-gold)', fontWeight: 500 }}>{distance} km</span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={handleSubmit} disabled={generating}
              style={{
                width: '100%', padding: '1rem', fontSize: '0.8rem', letterSpacing: '0.2em',
                textTransform: 'uppercase', fontWeight: 600,
                cursor: generating ? 'not-allowed' : 'pointer', border: 'none', marginTop: '0.5rem',
                background: generating ? 'rgba(201,168,76,0.4)' : 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
                color: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}
            >
              {generating ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid var(--color-bg)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Generating your trip...
                </>
              ) : (
                <><Sparkles size={15} /> Generate Trip Plan</>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* RIGHT — Map */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ position: 'sticky', top: 65, height: 'calc(100vh - 65px)', display: 'flex', flexDirection: 'column' }}
        >
          <MapContainer
            key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
            center={mapCenter} zoom={mapZoom}
            style={{ flex: 1, width: '100%' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com">CARTO</a>'
            />
            {sourceCoords && <Marker position={sourceCoords}><Popup>{form.source}</Popup></Marker>}
            {destCoords && <Marker position={destCoords}><Popup>{form.destination}</Popup></Marker>}
            {sourceCoords && destCoords && (
              <Polyline
                positions={[sourceCoords, destCoords]}
                pathOptions={{ color: '#C9A84C', weight: 2, dashArray: '8, 8', opacity: 0.8 }}
              />
            )}
          </MapContainer>

          {!sourceCoords && !destCoords && (
            <div style={{
              position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
              padding: '0.6rem 1.2rem', background: 'rgba(8,8,8,0.85)',
              border: '1px solid var(--color-border)', backdropFilter: 'blur(8px)',
              fontSize: '0.75rem', color: 'var(--color-cream-muted)', whiteSpace: 'nowrap', zIndex: 1000
            }}>
              Enter source & destination to see route
            </div>
          )}
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-container { background: #080808; }
      `}</style>
    </div>
  )
}