import { useState } from 'react'
import type { Track } from '../types'

interface Props {
  track: Track
  onPlay: () => void
  onStop: () => void
  isPlaying: boolean
}

export function MemeCard({ track, onPlay, onStop, isPlaying }: Props) {
  const [liked, setLiked] = useState(false)
  const [pressed, setPressed] = useState(false)

  const handleLike = () => {
    setLiked(l => !l)
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = track.b64
    a.download = `${track.name}.mp3`
    a.click()
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: track.name,
        text: `Слушай ${track.name} на MTRX`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // Generate a consistent color based on track name (no green)
  const getButtonColor = () => {
    const colors = [
      { main: '#4AA3FF', dark: '#2E84D6', shadow: '#1a5c99' },
      { main: '#FF9F43', dark: '#E67E22', shadow: '#b35900' },
      { main: '#9B59B6', dark: '#8E44AD', shadow: '#622c75' },
      { main: '#FF6B6B', dark: '#EE5A5A', shadow: '#c43d3d' },
      { main: '#F39C12', dark: '#D68910', shadow: '#996000' },
      { main: '#3498DB', dark: '#2980B9', shadow: '#1a5276' },
      { main: '#E74C3C', dark: '#C0392B', shadow: '#8b281f' },
      { main: '#95A5A6', dark: '#7F8C8D', shadow: '#566573' },
      { main: '#E91E63', dark: '#C2185B', shadow: '#880E4F' },
      { main: '#00BCD4', dark: '#0097A7', shadow: '#006064' },
    ]
    const index = track.name.length % colors.length
    return colors[index]
  }

  const colors = getButtonColor()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      maxWidth: 110,
    }}>
      {/* 3D Button */}
      <button
        onClick={() => {
          setPressed(true)
          setTimeout(() => setPressed(false), 100)
          if (isPlaying) {
            onStop()
          } else {
            onPlay()
          }
        }}
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: track.cover 
            ? `url(${track.cover}) center/cover` 
            : `linear-gradient(180deg, ${colors.main} 0%, ${colors.dark} 100%)`,
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transform: pressed ? 'translateY(4px)' : 'translateY(0)',
          boxShadow: pressed
            ? `0 0 0 ${colors.shadow}, inset 0 2px 4px rgba(0,0,0,0.3)`
            : `0 4px 0 ${colors.shadow}, 0 5px 10px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.08s ease, box-shadow 0.08s ease',
          outline: 'none',
        }}
      >
        {/* Inner ring for button effect */}
        <div style={{
          position: 'absolute',
          top: 6,
          left: 6,
          right: 6,
          bottom: 6,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.15)',
          pointerEvents: 'none',
        }} />
        
        {/* Shine effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)',
          borderRadius: '50% 50% 0 0',
          pointerEvents: 'none',
        }} />

        {/* Playing indicator - full circle overlay */}
        {isPlaying && (
          <>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              borderRadius: '50%',
            }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}>
              <div style={{
                display: 'flex',
                gap: 4,
                alignItems: 'flex-end',
                height: 32,
              }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    style={{
                      width: 5,
                      height: `${10 + Math.random() * 16}px`,
                      background: '#fff',
                      borderRadius: 2,
                      animation: `bounce 0.4s ease-in-out infinite ${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Letter (only if no cover) */}
        {!track.cover && !isPlaying && (
          <span style={{ 
            fontSize: 42, 
            color: 'rgba(255,255,255,0.95)', 
            fontWeight: 700,
            textShadow: '0 3px 6px rgba(0,0,0,0.4)',
          }}>
            {track.name[0]?.toUpperCase()}
          </span>
        )}
      </button>

      {/* Title as link */}
      <a
        href="#"
        onClick={e => { e.preventDefault(); onPlay() }}
        style={{
          fontSize: 12,
          color: '#4A9EFF',
          textDecoration: 'none',
          textAlign: 'center',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.3,
          fontWeight: 500,
        }}
      >
        {track.name.length > 24 ? track.name.substring(0, 22) + '...' : track.name}
      </a>

      {/* Actions - heart, share, download */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleLike}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#ff4444',
            padding: 0,
            opacity: liked ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <button
          onClick={handleShare}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#4A9EFF',
            padding: 0,
            opacity: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
        <button
          onClick={handleDownload}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#44ff88',
            padding: 0,
            opacity: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
