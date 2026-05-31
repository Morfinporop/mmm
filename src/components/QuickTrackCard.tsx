import { useState, useEffect } from 'react'
import { IPlay, IPause, IHeart } from '../icons'
import type { Track } from '../types'
import { fmtTime } from '../utils'

interface Props {
  track: Track
  isPlaying: boolean
  onPlay: () => void
  onStop: () => void
  onLike: () => void
  isLiked: boolean
  user?: { name: string; avatar: string }
}

export const LANGUAGES = [
  { code: 'GLOBAL', name: 'Глобал' },
  { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'CN', name: 'China' },
  { code: 'DE', name: 'Germany' },
  { code: 'BY', name: 'Belarus' },
  { code: 'US', name: 'USA' },
  { code: 'GB', name: 'UK' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'Korea' },
  { code: 'BR', name: 'Brazil' },
  { code: 'IN', name: 'India' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'TR', name: 'Turkey' },
  { code: 'PL', name: 'Poland' },
  { code: 'KZ', name: 'Kazakhstan' },
]

export const FLAGS: Record<string, string> = {
  GLOBAL: '🌍', RU: '🇷', UA: '🇦', CN: '🇨🇳', DE: '🇩', BY: '🇧',
  US: '🇸', GB: '🇬', FR: '🇫🇷', JP: '🇯', KR: '🇰🇷', BR: '🇧',
  IN: '🇳', ES: '🇪', IT: '🇮', CA: '🇨🇦', AU: '🇦', MX: '🇲🇽',
  TR: '🇹🇷', PL: '🇵🇱', KZ: '🇰🇿',
}

export function QuickTrackCard({ track, isPlaying, onPlay, onStop, onLike, isLiked, user }: Props) {
  const [likes, setLikes] = useState(() => {
    const saved = localStorage.getItem(`likes_${track.id}`)
    return saved ? parseInt(saved) : 0
  })
  const [plays, setPlays] = useState(() => {
    const saved = localStorage.getItem(`plays_${track.id}`)
    return saved ? parseInt(saved) : 0
  })
  const [downloads, setDownloads] = useState(() => {
    const saved = localStorage.getItem(`downloads_${track.id}`)
    return saved ? parseInt(saved) : 0
  })
  const [reported, setReported] = useState(() => {
    const saved = localStorage.getItem(`reported_${track.id}`)
    return saved === 'true'
  })
  const [timeAgo, setTimeAgo] = useState('')
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const now = Date.now()
    const added = track.addedAt || now
    const diff = now - added
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (hours < 1) {
      const mins = Math.floor(diff / (1000 * 60))
      setTimeAgo(`${mins} мин. назад`)
    } else if (hours < 24) {
      setTimeAgo(`${hours} ч. назад`)
    } else if (days < 7) {
      setTimeAgo(`${days} д. назад`)
    } else {
      const date = new Date(added)
      setTimeAgo(date.toLocaleDateString('ru-RU'))
    }
  }, [track.addedAt])

  useEffect(() => {
    localStorage.setItem(`likes_${track.id}`, String(likes))
  }, [likes, track.id])

  useEffect(() => {
    localStorage.setItem(`plays_${track.id}`, String(plays))
  }, [plays, track.id])

  useEffect(() => {
    localStorage.setItem(`downloads_${track.id}`, String(downloads))
  }, [downloads, track.id])

  useEffect(() => {
    localStorage.setItem(`reported_${track.id}`, String(reported))
  }, [reported, track.id])

  // Force re-render for waveform animation and time tracking
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!isPlaying) {
      setCurrentTime(0)
      return
    }
    const interval = setInterval(() => {
      setTick(t => t + 1)
      setCurrentTime(t => {
        const newTime = t + 0.1
        return newTime >= track.duration ? track.duration : newTime
      })
    }, 100)
    return () => clearInterval(interval)
  }, [isPlaying, track.duration])

  const handlePlay = () => {
    if (isPlaying) {
      onStop()
    } else {
      onPlay()
    }
  }

  // Count play only after full listen (once per account)
  useEffect(() => {
    if (!isPlaying) return
    
    const hasCounted = localStorage.getItem(`counted_${track.id}`)
    if (hasCounted === 'true') return

    const timer = setTimeout(() => {
      // Check if track is still playing after duration
      if (isPlaying) {
        setPlays(p => {
          const newPlays = p + 1
          localStorage.setItem(`plays_${track.id}`, String(newPlays))
          localStorage.setItem(`counted_${track.id}`, 'true')
          return newPlays
        })
      }
    }, track.duration * 1000)

    return () => clearTimeout(timer)
  }, [isPlaying, track.duration, track.id])

  const handleLike = () => {
    setLikes(l => {
      const newLikes = isLiked ? l - 1 : l + 1
      onLike()
      return newLikes
    })
  }

  const handleDownload = () => {
    setDownloads(d => d + 1)
  }

  const handleReport = () => {
    if (confirm('Заблокировать этот трек?')) {
      setReported(true)
    }
  }

  const handleUnblock = () => {
    setReported(false)
  }

  if (reported) {
    return (
      <div style={{
        background: 'linear-gradient(180deg, #1e1e1e 0%, #141414 100%)',
        borderRadius: 14,
        padding: 24,
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        minHeight: 200,
        justifyContent: 'center',
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
        <div style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>
          Этот трек заблокирован для вас
        </div>
        <button
          onClick={handleUnblock}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: '8px 20px',
            color: '#FFF',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Отменить
        </button>
      </div>
    )
  }

  const tags = []
  const nameLower = track.name.toLowerCase()
  if (nameLower.includes('мем')) tags.push('мем')
  if (nameLower.includes('смешно')) tags.push('смешно')
  if (nameLower.includes('звук')) tags.push('звук')
  if (nameLower.includes('саунд')) tags.push('саунд')

  return (
    <div style={{
      background: 'linear-gradient(180deg, #1e1e1e 0%, #141414 100%)',
      borderRadius: 14,
      padding: 16,
      border: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', flex: 1, lineHeight: 1.3 }}>
          {track.name.toUpperCase()}
        </div>
        <div style={{
          fontSize: 10,
          color: isPlaying ? '#10B981' : '#888',
          background: 'rgba(0,0,0,0.5)',
          padding: '4px 8px',
          borderRadius: 6,
          fontWeight: 500,
          minWidth: '36px',
          textAlign: 'center',
        }}>
          {fmtTime(currentTime)}
        </div>
      </div>

      {/* Waveform + Play - Full Width Animated */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={handlePlay}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          {isPlaying ? <IPause s={16} /> : <IPlay s={16} />}
        </button>
        <div style={{
          flex: 1,
          height: 48,
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 3,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {Array.from({ length: 70 }, (_, i) => {
            const phase = isPlaying ? Date.now() / 150 : 0
            const baseHeight = 10 + Math.sin(i * 0.2 + phase) * 14 + Math.sin(i * 0.5 + phase * 0.5) * 8
            const isActive = isPlaying
            return (
              <div
                key={i}
                style={{
                  width: 3,
                  height: `${Math.max(6, isActive ? baseHeight : baseHeight * 0.25)}px`,
                  background: isActive ? `rgba(16,185,129,${0.5 + Math.sin(i * 0.3 + phase) * 0.4})` : '#2a2a2a',
                  borderRadius: 2,
                  transition: 'height 0.08s ease',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.slice(0, 3).map((tag, i) => (
            <span key={i} style={{
              fontSize: 10,
              color: '#aaa',
              background: 'rgba(255,255,255,0.06)',
              padding: '4px 10px',
              borderRadius: 8,
              fontWeight: 400,
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Add to Soundpad button */}
      <button
        onClick={() => {
          // Open Soundpad website or add to local soundboard
          const soundpadUrl = `https://soundpad.app/add?name=${encodeURIComponent(track.name)}&url=${encodeURIComponent(window.location.origin)}`
          window.open(soundpadUrl, '_blank')
          // Also play locally
          handlePlay()
        }}
        style={{
          width: '100%',
          background: 'linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: '12px 16px',
          color: '#FFF',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(180deg, #333 0%, #252525 100%)'}
        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%)'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
        Добавить в Soundpad
      </button>

      {/* Stats row 1 */}
      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#666', alignItems: 'center' }}>
        <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: isLiked ? '#10B981' : '#666', padding: 0 }}>
          <IHeart filled={isLiked} /> {likes}
        </button>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          {plays >= 1000 ? `${(plays / 1000).toFixed(1)}k` : plays}
        </span>
        <button onClick={handleDownload} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#666', padding: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {downloads >= 1000 ? `${(downloads / 1000).toFixed(1)}k` : downloads}
        </button>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={handleReport} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
        </span>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {tags.slice(0, 4).map((tag, i) => (
            <span key={i} style={{
              fontSize: 10,
              color: '#aaa',
              background: 'rgba(255,255,255,0.06)',
              padding: '4px 10px',
              borderRadius: 8,
              fontWeight: 400,
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Author + Time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: user?.avatar ? `url(${user.avatar}) center/cover` : '#2a2a2a',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: '#666',
            fontWeight: 600,
          }}>
            {!user?.avatar && (user?.name || track.artist || '?')[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: 11, color: '#aaa', fontWeight: 500 }}>{user?.name || track.artist || 'Аноним'}</span>
        </div>
        <span style={{ fontSize: 11, color: '#666' }}>{timeAgo}</span>
      </div>
    </div>
  )
}
