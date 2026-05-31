import { useState, useRef, useEffect, useCallback } from 'react'
import { StaticGrid } from './components/StaticGrid'
import { UploadModal } from './components/UploadModal'
import { ProfileScreen } from './components/ProfileScreen'
import { AuthModal } from './components/AuthModal'
import { QuickTrackCard } from './components/QuickTrackCard'
import { MemeCard } from './components/MemeCard'
import { IPlay, IPause, INext, IPrev, IShuffle, IRepeat, IVol, ISearch, IHeart, IMusic, IBolt } from './icons'
import type { Track, User } from './types'
import { fmtTime, loadTracks, saveTracks, loadUser } from './utils'
import { CATEGORIES } from './types'

// Waveform Component
function SeekWaveform({ analyser, isPlaying, progress, onSeek }: any) {
  const cvs = useRef<HTMLCanvasElement>(null)
  const raf = useRef<number>(0)
  const bars = useRef<number[]>([])
  const N = 90

  useEffect(() => {
    if (!bars.current.length)
      bars.current = Array.from({ length: N }, (_, i) => 0.1 + Math.sin((i / N) * Math.PI) * 0.55 + Math.random() * 0.15)
  }, [])

  useEffect(() => {
    const canvas = cvs.current!
    const ctx = canvas.getContext('2d')!
    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const bw = W / N, gap = 2
      let freq: number[] = bars.current
      if (analyser && isPlaying) {
        const buf = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(buf)
        freq = Array.from(buf).slice(0, N).map(v => v / 255)
      }
      for (let i = 0; i < N; i++) {
        const v = freq[i] ?? 0.1
        const bH = Math.max(3, v * H * 0.88)
        const x = i * bw + gap / 2, y = (H - bH) / 2
        const filled = i / N <= progress
        const grad = ctx.createLinearGradient(0, y, 0, y + bH)
        if (filled) {
          grad.addColorStop(0, 'rgba(180,180,180,1)')
          grad.addColorStop(1, 'rgba(100,100,100,0.85)')
        } else {
          grad.addColorStop(0, 'rgba(90,90,90,0.7)')
          grad.addColorStop(1, 'rgba(50,50,50,0.5)')
        }
        ctx.fillStyle = grad
        ctx.fillRect(x, y, Math.max(1.5, bw - gap), bH)
      }
      raf.current = requestAnimationFrame(draw)
    }
    raf.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf.current)
  }, [analyser, isPlaying, progress])

  return <canvas ref={cvs} width={1400} height={40} onClick={e => {
    const rect = cvs.current!.getBoundingClientRect()
    onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
  }} style={{ width: '100%', height: '40px', display: 'block', cursor: 'pointer' }} />
}

// Audio Engine
const CF_MS = 1500
function useAudioEngine() {
  const actx = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const elRef = useRef<HTMLAudioElement | null>(null)

  const ctx = () => {
    if (!actx.current) {
      actx.current = new AudioContext()
      analyserRef.current = actx.current.createAnalyser()
      analyserRef.current.fftSize = 256
      gainRef.current = actx.current.createGain()
      gainRef.current.connect(analyserRef.current)
      analyserRef.current.connect(actx.current.destination)
    }
    return actx.current
  }

  const play = useCallback(async (b64: string, onEnd: () => void) => {
    const ac = ctx()
    if (ac.state === 'suspended') await ac.resume()
    if (gainRef.current) {
      const g = gainRef.current
      g.gain.cancelScheduledValues(ac.currentTime)
      g.gain.setValueAtTime(g.gain.value, ac.currentTime)
      g.gain.linearRampToValueAtTime(0, ac.currentTime + CF_MS / 1000)
    }
    if (elRef.current) {
      const old = elRef.current
      setTimeout(() => { old.pause(); old.src = '' }, CF_MS)
    }
    const el = new Audio(b64)
    el.crossOrigin = 'anonymous'
    elRef.current = el
    const src = ac.createMediaElementSource(el)
    const ng = ac.createGain()
    ng.gain.setValueAtTime(0, ac.currentTime)
    ng.gain.linearRampToValueAtTime(1, ac.currentTime + CF_MS / 1000)
    src.connect(ng)
    ng.connect(analyserRef.current!)
    gainRef.current = ng
    el.onended = onEnd
    el.play().catch(() => {})
    return el
  }, [])

  const pause = useCallback(() => elRef.current?.pause(), [])
  const resume = useCallback(async () => {
    const ac = ctx()
    if (ac.state === 'suspended') await ac.resume()
    elRef.current?.play().catch(() => {})
  }, [])
  const seek = useCallback((t: number) => { if (elRef.current) elRef.current.currentTime = t }, [])

  return { play, pause, resume, seek, analyser: analyserRef, el: elRef }
}

// Main App
export default function App() {
  const [tracks, setTracks] = useState<Track[]>(loadTracks)
  const [user, setUser] = useState<User | null>(loadUser)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCT] = useState(0)
  const [duration, setDur] = useState(0)
  const [volume, setVol] = useState(0.85)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [activeCat, setActiveCat] = useState('Все')
  const [showUpload, setShowUpload] = useState(false)
  const [showUploadQuick, setShowUploadQuick] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [sidebarTab, setSidebarTab] = useState<'music' | 'quick' | 'memes'>('music')
  const [page, setPage] = useState(1)
  const TRACKS_PER_PAGE = 7

  const mainRef = useRef<HTMLDivElement>(null)
  const engine = useAudioEngine()
  const current = tracks.find(t => t.id === currentId) ?? null
  const progress = duration > 0 ? currentTime / duration : 0

  const musicTracks = tracks.filter(t => !t.isQuick)
  const quickTracks = tracks.filter(t => t.isQuick && t.category !== 'Мемы')
  const memeTracks = tracks.filter(t => t.category === 'Мемы')
  const displayTracks = sidebarTab === 'music' ? musicTracks : sidebarTab === 'memes' ? memeTracks : quickTracks

  let filteredTracks = activeCat === 'Все' ? displayTracks : displayTracks.filter(t => t.category === activeCat)
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filteredTracks = filteredTracks.filter(t => t.name.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q))
  }

  const totalPages = Math.ceil(filteredTracks.length / TRACKS_PER_PAGE)
  const pagedTracks = filteredTracks.slice((page - 1) * TRACKS_PER_PAGE, page * TRACKS_PER_PAGE)

  useEffect(() => { setPage(1) }, [activeCat, sidebarTab, searchQuery])

  useEffect(() => {
    if (engine.el.current) engine.el.current.volume = muted ? 0 : volume
  }, [volume, muted])

  const playTrack = useCallback(async (track: Track) => {
    setCurrentId(track.id); setCT(0); setDur(track.duration); setIsPlaying(true)
    const el = await engine.play(track.b64, () => {
      const list = sidebarTab === 'music' ? musicTracks : sidebarTab === 'memes' ? memeTracks : quickTracks
      const idx = list.findIndex(t => t.id === track.id)
      if (repeat) playTrack(track)
      else if (shuffle) {
        const others = list.filter(t => t.id !== track.id)
        if (others.length) playTrack(others[Math.floor(Math.random() * others.length)])
      } else {
        const next = list[(idx + 1) % list.length]
        if (next) playTrack(next)
      }
    })
    if (el) {
      el.addEventListener('timeupdate', () => setCT(el.currentTime))
      el.addEventListener('loadedmetadata', () => setDur(el.duration || 0))
      el.volume = muted ? 0 : volume
    }
  }, [repeat, shuffle, musicTracks, quickTracks, memeTracks, sidebarTab, volume, muted])

  const stopTrack = useCallback(() => {
    engine.pause()
    setIsPlaying(false)
  }, [])

  const togglePlay = () => {
    if (!current) { if (displayTracks.length) playTrack(displayTracks[0]); return }
    if (isPlaying) { engine.pause(); setIsPlaying(false) }
    else { engine.resume(); setIsPlaying(true) }
  }

  const goNext = () => {
    const list = sidebarTab === 'music' ? musicTracks : quickTracks
    if (!list.length) return
    const idx = list.findIndex(t => t.id === currentId)
    const next = shuffle ? list[Math.floor(Math.random() * list.length)] : list[(idx + 1) % list.length]
    playTrack(next)
  }

  const goPrev = () => {
    const list = sidebarTab === 'music' ? musicTracks : quickTracks
    if (!list.length) return
    if (engine.el.current && engine.el.current.currentTime > 3) { engine.seek(0); return }
    const idx = list.findIndex(t => t.id === currentId)
    playTrack(list[(idx - 1 + list.length) % list.length])
  }

  const deleteTrack = (id: string) => {
    if (currentId === id) { engine.pause(); setIsPlaying(false); setCurrentId(null) }
    setTracks(prev => { const upd = prev.filter(t => t.id !== id); saveTracks(upd); return upd })
  }

  const updateUserTracks = (newName: string) => {
    setTracks(prev => {
      const updated = prev.map(t => {
        if (t.artist === user?.name || t.artist === user?.email?.split('@')[0]) {
          return { ...t, artist: newName }
        }
        return t
      })
      saveTracks(updated)
      return updated
    })
  }

  const toggleFav = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleUpload = () => {
    if (!user) { alert('Войдите в аккаунт для загрузки музыки'); return }
    sidebarTab === 'music' ? setShowUpload(true) : setShowUploadQuick(true)
  }

  return (
    <div style={{ background: '#000000', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <StaticGrid />

      {/* Top Bar */}
      <div className="topbar">
        <span className="gradient-text mono" style={{ fontSize: 18, fontWeight: 400, letterSpacing: '0.18em' }}>MTRX</span>
        
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 500, paddingLeft: 20, paddingRight: 20 }}>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="Поиск треков..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '7px 14px 7px 38px', fontSize: 12, color: '#D1D5DB', outline: 'none' }} />
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }}><ISearch /></div>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleUpload} className="cat-pill" style={{ padding: '7px 14px' }}>
            + Загрузить
          </button>

          {user ? (
            <button onClick={() => setShowProfile(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.25)', background: user.avatar ? `url(${user.avatar}) center/cover` : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#999' }}>
                {!user.avatar && (user.name || '?')[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 12, color: '#D1D5DB' }}>{user.name}</span>
            </button>
          ) : (
            <button onClick={() => setShowAuth(true)} className="cat-pill" style={{ padding: '7px 16px' }}>Войти</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, paddingTop: 58, paddingBottom: displayTracks.length > 0 ? 100 : 0 }}>
        {/* Sidebar */}
        <div className="sidebar">
          <button className={`sidebar-btn ${sidebarTab === 'quick' ? 'active' : ''}`} onClick={() => setSidebarTab('quick')}>
            <IBolt /> Быстрые
            <span style={{ marginLeft: 'auto', fontSize: 9, background: '#F5F5F5', color: '#000', borderRadius: 10, padding: '2px 6px', fontWeight: 600 }}>BETA</span>
          </button>
          <button className={`sidebar-btn ${sidebarTab === 'memes' ? 'active' : ''}`} onClick={() => setSidebarTab('memes')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            Мемы
          </button>
          <button className={`sidebar-btn ${sidebarTab === 'music' ? 'active' : ''}`} onClick={() => setSidebarTab('music')}>
            <IMusic /> Музыка
          </button>
        </div>

        {/* Main */}
        <div ref={mainRef} style={{ flex: 1, marginLeft: 220, overflowY: 'auto', padding: '28px 24px 0' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            
            {sidebarTab === 'quick' || sidebarTab === 'memes' ? (
              <>
                {/* Quick section header */}
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 600, color: '#F5F5F5', margin: 0 }}>
                    {sidebarTab === 'memes' ? 'Мемы' : 'В тренде'}
                  </h1>
                </div>

                {/* Quick tracks grid */}
                {sidebarTab === 'memes' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, padding: 20 }}>
                    {memeTracks.map(track => (
                      <MemeCard
                        key={track.id}
                        track={track}
                        isPlaying={currentId === track.id && isPlaying}
                        onPlay={() => playTrack(track)}
                        onStop={stopTrack}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {quickTracks.map(track => (
                      <QuickTrackCard
                        key={track.id}
                        track={track}
                        isPlaying={currentId === track.id && isPlaying}
                        onPlay={() => playTrack(track)}
                        onStop={stopTrack}
                        onLike={() => toggleFav(track.id)}
                        isLiked={favorites.has(track.id)}
                        user={user || undefined}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Music section - list view */}
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 20, scrollbarWidth: 'none', marginBottom: 16 }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} className={`cat-pill ${activeCat === cat ? 'active' : ''}`} onClick={() => setActiveCat(cat)}>{cat}</button>
                  ))}
                </div>

                {pagedTracks.length > 0 && (
                  <div className="glass" style={{ borderRadius: 12, overflow: 'hidden' }}>
                    {pagedTracks.map((track, i) => {
                      const active = track.id === currentId
                      return (
                        <div key={track.id} className={`track-item ${active ? 'active' : ''}`} onClick={() => playTrack(track)}>
                          <span className="mono" style={{ fontSize: 10, color: '#6B7280', width: 20 }}>{String((page - 1) * TRACKS_PER_PAGE + i + 1).padStart(2, '0')}</span>
                          <div style={{ width: 42, height: 42, borderRadius: 7, background: track.cover ? `url(${track.cover}) center/cover` : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', flexShrink: 0, border: '1px solid rgba(255,255,255,0.04)' }}>
                            {!track.cover && <IMusic />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: active ? '#F5F5F5' : '#C5D1CB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</div>
                            <div style={{ fontSize: 11, color: '#6B7280' }}>{track.artist}</div>
                          </div>
                          <span className="mono" style={{ fontSize: 11, color: '#6B7280' }}>{fmtTime(track.duration)}</span>
                          <button className="btn-icon" onClick={e => { e.stopPropagation(); toggleFav(track.id) }}>
                            <IHeart filled={favorites.has(track.id)} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', marginTop: 20, alignItems: 'center' }}>
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                  className="cat-pill"
                  style={{ minWidth: 32, opacity: page === 1 ? 0.3 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
                  ←
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)} className={`cat-pill ${page === pageNum ? 'active' : ''}`} style={{ minWidth: 32 }}>
                      {pageNum}
                    </button>
                  )
                })}
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages}
                  className="cat-pill"
                  style={{ minWidth: 32, opacity: page === totalPages ? 0.3 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
                  →
                </button>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Player - only show in music tab */}
      {sidebarTab === 'music' && displayTracks.length > 0 && (
        <div className="player-bar">
          <div style={{ padding: '8px 20px 4px' }}>
            <SeekWaveform analyser={engine.analyser.current} isPlaying={isPlaying && !!current} progress={progress}
              onSeek={(r: number) => { const t = r * duration; engine.seek(t); setCT(t) }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 20px 10px', gap: 20 }}>
            {/* Track info - Left */}
            <div style={{ width: 240, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              {current ? (
                <>
                  <div style={{ width: 48, height: 48, borderRadius: 6, background: current.cover ? `url(${current.cover}) center/cover` : '#1a1a1a', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                    {!current.cover && <IMusic />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#F5F5F5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {current.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#6B7280' }}>{current.artist}</div>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 11, color: '#4B5563' }}>Нет трека</div>
              )}
            </div>

            {/* Controls - Center */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <button className="btn-icon" onClick={e => { e.stopPropagation(); setShuffle(s => !s) }} style={{ opacity: shuffle ? 1 : 0.6 }}><IShuffle on={shuffle} /></button>
              <button className="btn-icon" onClick={e => { e.stopPropagation(); goPrev() }}><IPrev /></button>
              <button className="btn-play" onClick={e => { e.stopPropagation(); togglePlay() }}>
                <span style={{ color: '#F5F5F5' }}>{isPlaying ? <IPause s={14} /> : <IPlay s={14} />}</span>
              </button>
              <button className="btn-icon" onClick={e => { e.stopPropagation(); goNext() }}><INext /></button>
              <button className="btn-icon" onClick={e => { e.stopPropagation(); setRepeat(r => !r) }} style={{ opacity: repeat ? 1 : 0.6 }}><IRepeat on={repeat} /></button>
            </div>

            {/* Time + Like + Volume - Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div className="mono" style={{ fontSize: 10, color: '#8B9A92' }}>{fmtTime(currentTime)} / {fmtTime(duration)}</div>
              {current && <button className="btn-icon" onClick={() => toggleFav(current.id)}><IHeart filled={favorites.has(current.id)} /></button>}
              <button className="btn-icon" onClick={() => setMuted(m => !m)}><IVol m={muted} /></button>
              <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume} style={{ width: 70 }} onChange={e => { const v = +e.target.value; setVol(v); setMuted(v === 0) }} />
            </div>
          </div>
        </div>
      )}

      {showUpload && <UploadModal userName={user?.name} isMeme={sidebarTab === 'memes'} onClose={() => setShowUpload(false)} onAdd={newTracks => { setTracks(prev => { const upd = [...prev, ...newTracks]; saveTracks(upd); return upd }); alert(`Добавлено ${newTracks.length} треков`) }} />}
      {showUploadQuick && <UploadModal userName={user?.name} isQuick isMeme={sidebarTab === 'memes'} onClose={() => setShowUploadQuick(false)} onAdd={newTracks => { setTracks(prev => { const upd = [...prev, ...newTracks]; saveTracks(upd); return upd }); alert(`Добавлено ${newTracks.length} треков`) }} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onDone={u => { setUser(u); setShowAuth(false); alert(`Добро пожаловать, ${u.name}!`) }} />}
      {showProfile && user && <ProfileScreen user={user} tracks={tracks} onClose={() => setShowProfile(false)} onUpdate={u => setUser(u)} onLogout={() => { setUser(null); localStorage.removeItem('mtrx_user_v1'); setShowProfile(false) }} onDeleteTrack={deleteTrack} onUpdateUserTracks={updateUserTracks} />}
    </div>
  )
}
