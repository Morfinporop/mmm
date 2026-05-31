import { useState, useRef, useEffect } from 'react'
import { ISettings, ITrash, IMusic } from '../icons'
import type { Track, User } from '../types'
import { fmtTime, saveUser, toBase64 } from '../utils'

interface Props {
  user: User
  tracks: Track[]
  onClose: () => void
  onUpdate: (u: User) => void
  onLogout: () => void
  onDeleteTrack: (id: string) => void
  onUpdateUserTracks: (newName: string) => void
}

export function ProfileScreen({ user, tracks, onClose, onUpdate, onLogout, onDeleteTrack, onUpdateUserTracks }: Props) {
  const [edit, setEdit] = useState({ ...user })
  const [showSettings, setShowSettings] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  const save = () => {
    saveUser(edit)
    onUpdate(edit)
    if (user.name !== edit.name) {
      onUpdateUserTracks(edit.name)
    }
    setShowSettings(false)
  }

  // Update user's name/avatar on their tracks
  useEffect(() => {
    if (user.name !== edit.name || user.avatar !== edit.avatar) {
      // Tracks will be updated via onUpdateUserTracks callback
    }
  }, [edit.name, edit.avatar])

  return (
    <div className="profile-screen fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Banner - Full Screen */}
      <div style={{ position: 'relative', height: '100vh', width: '100vw', background: edit.banner ? `url(${edit.banner}) center/cover` : 'linear-gradient(135deg,#1a1a1a 0%,#0a0a0a 50%,#000 100%)', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.4) 0%,rgba(0,0,0,0.85) 100%)' }} />
        
        <button onClick={onClose} className="btn-icon" style={{ position: 'fixed', top: 20, left: 20, background: 'rgba(0,0,0,0.6)', borderRadius: 10, zIndex: 100, padding: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        <button onClick={() => setShowSettings(true)} className="btn-icon" style={{ position: 'fixed', top: 20, right: 20, background: 'rgba(0,0,0,0.6)', borderRadius: 10, zIndex: 100, padding: '10px' }}>
          <ISettings />
        </button>

        <button onClick={() => bannerRef.current?.click()} className="btn-icon" style={{ position: 'fixed', top: 20, right: 64, background: 'rgba(0,0,0,0.6)', borderRadius: 10, fontSize: 11, padding: '8px 14px', whiteSpace: 'nowrap', zIndex: 100 }}>
          Баннер
        </button>
        <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={async e => { if (e.target.files?.[0]) { const b = await toBase64(e.target.files[0]); setEdit(v => ({ ...v, banner: b })); saveUser({ ...edit, banner: b }); onUpdate({ ...edit, banner: b }) } }} />

        {/* Content - Centered */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, width: '90%', maxWidth: 500 }}>
          {/* Avatar */}
          <div className="avatar-ring" style={{ width: 140, height: 140, cursor: 'pointer', position: 'relative', marginBottom: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} onClick={() => avatarRef.current?.click()}>
            {edit.avatar ? (
              <img src={edit.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg,#444,#1a1a1a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#ccc', fontWeight: 600 }}>
                {(edit.name || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={async e => { if (e.target.files?.[0]) { const b = await toBase64(e.target.files[0]); setEdit(v => ({ ...v, avatar: b })); saveUser({ ...edit, avatar: b }); onUpdate({ ...edit, avatar: b }) } }} />

          {/* Name editable */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <input
              value={edit.name}
              onChange={e => { setEdit(v => ({ ...v, name: e.target.value })); saveUser({ ...edit, name: e.target.value }); onUpdate({ ...edit, name: e.target.value }) }}
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: '#FFF',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid rgba(255,255,255,0.2)',
                outline: 'none',
                textAlign: 'center',
                width: '100%',
                padding: '12px 0',
                marginBottom: 12,
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
              placeholder="Ваше имя"
            />
            <input
              value={edit.bio}
              onChange={e => { setEdit(v => ({ ...v, bio: e.target.value })); saveUser({ ...edit, bio: e.target.value }); onUpdate({ ...edit, bio: e.target.value }) }}
              style={{
                fontSize: 15,
                color: '#aaa',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.12)',
                outline: 'none',
                textAlign: 'center',
                width: '100%',
                padding: '10px 0',
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              }}
              placeholder="Описание профиля"
            />
          </div>
        </div>
      </div>

      {/* Track list - Hidden, settings modal shows tracks */}
      <div style={{ display: 'none' }}>

        {/* Track list */}
        {tracks.length > 0 && (
          <div style={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>
            <div className="label-xs" style={{ marginBottom: 12 }}>МОЯ МУЗЫКА</div>
            <div className="glass" style={{ borderRadius: 10, overflow: 'hidden', maxHeight: 500, overflowY: 'auto' }}>
              {tracks.map((t, i) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                  borderBottom: i < tracks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span className="mono" style={{ fontSize: 10, color: '#6B7280', width: 20 }}>{String(i + 1).padStart(2, '0')}</span>
                  <div style={{ width: 42, height: 42, borderRadius: 6, background: t.cover ? `url(${t.cover}) center/cover` : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', flexShrink: 0, border: '1px solid rgba(255,255,255,0.06)' }}>
                    {!t.cover && <IMusic />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#D1D5DB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{t.artist}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: '#6B7280' }}>{fmtTime(t.duration)}</span>
                  <button className="btn-icon" style={{ opacity: 0.5 }} onClick={() => onDeleteTrack(t.id)}>
                    <ITrash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay fade-in" onClick={() => setShowSettings(false)}>
          <div className="modal-card fade-up" onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: 20, fontSize: 14, fontWeight: 500, letterSpacing: '0.1em', color: '#D1D5DB' }}>НАСТРОЙКИ</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div className="label-xs" style={{ marginBottom: 8 }}>Email</div>
                <input className="field" type="email" value={edit.email} onChange={e => setEdit(v => ({ ...v, email: e.target.value }))} placeholder="email@example.com" />
              </div>
              
              <div>
                <div className="label-xs" style={{ marginBottom: 8 }}>Пароль</div>
                <input className="field" type="password" placeholder="Новый пароль (не сохраняется)" />
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />

              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Настройки плеера</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: 12, color: '#D1D5DB' }}>Автовоспроизведение</span>
                <div style={{ width: 40, height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.15)', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#F5F5F5', position: 'absolute', right: 2, top: 2, transition: 'all 0.2s' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: 12, color: '#D1D5DB' }}>Быстрая перемотка (10 сек)</span>
                <div style={{ width: 40, height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.15)', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#F5F5F5', position: 'absolute', right: 2, top: 2 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: 12, color: '#D1D5DB' }}>Нормализация громкости</span>
                <div style={{ width: 40, height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.15)', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#F5F5F5', position: 'absolute', right: 2, top: 2 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: 12, color: '#D1D5DB' }}>Crossfade переходы</span>
                <div style={{ width: 40, height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.15)', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#F5F5F5', position: 'absolute', right: 2, top: 2 }} />
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

              <button onClick={onLogout} style={{ width: '100%', background: 'transparent', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, padding: '10px 14px', color: '#EF4444', fontSize: 12, cursor: 'pointer', letterSpacing: '0.06em', marginBottom: 8 }}>
                Выйти из аккаунта
              </button>
              
              <button className="btn-primary" style={{ marginTop: 4 }} onClick={save}>Сохранить настройки</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
