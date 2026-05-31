import { useState, useRef } from 'react'
import { IClose, IUpload, IImage } from '../icons'
import type { Track } from '../types'
import { toBase64, parseArtist } from '../utils'

interface Props {
  onClose: () => void
  onAdd: (tracks: Track[]) => void
  isQuick?: boolean
  userName?: string
  isMeme?: boolean
}

export function UploadModal({ onClose, onAdd, isQuick, userName, isMeme }: Props) {
  const [drag, setDrag] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pendingTracks, setPendingTracks] = useState<Array<{
    id: string
    file: File
    name: string
    artist: string
    category: string
    cover: string
  }>>([])

  const audioRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('audio/'))
    if (!arr.length) return

    setLoading(true)
    const pending = []

    for (const file of arr) {
      const { artist, title } = parseArtist(file.name)
      pending.push({
        id: crypto.randomUUID(),
        file,
        name: title,
        artist: artist || userName || 'Неизвестный исполнитель',
        category: isMeme ? 'Мемы' : (isQuick ? 'RU' : 'Другое'),
        cover: '',
      })
    }

    setPendingTracks(pending)
    setLoading(false)
  }

  const handleCover = async (idx: number, file: File) => {
    const b64 = await toBase64(file)
    setPendingTracks(prev => prev.map((t, i) => i === idx ? { ...t, cover: b64 } : t))
  }

  const submit = async () => {
    setLoading(true)
    const tracks: Track[] = []

    for (const pt of pendingTracks) {
      const b64 = await toBase64(pt.file)
      const dur = await new Promise<number>(res => {
        const a = new Audio(b64)
        a.addEventListener('loadedmetadata', () => res(a.duration || 0), { once: true })
        a.addEventListener('error', () => res(0), { once: true })
      })

      if (isQuick && dur > 30) {
        alert(`Трек "${pt.name}" слишком длинный для быстрых (${Math.floor(dur)}с). Макс 30 сек.`)
        continue
      }

      tracks.push({
        id: pt.id,
        name: pt.name,
        artist: pt.artist,
        duration: dur,
        b64,
        size: pt.file.size,
        addedAt: Date.now(),
        category: pt.category,
        cover: pt.cover,
        isQuick: isQuick,
      })
    }

    onAdd(tracks)
    onClose()
  }

  return (
    <div className="modal-overlay fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card fade-up" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="btn-icon" style={{ position: 'absolute', top: 14, right: 14 }} onClick={onClose}>
          <IClose />
        </button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '0.1em', color: '#D1D5DB', marginBottom: 4 }}>
            {isMeme ? 'ЗАГРУЗКА МЕМА' : (isQuick ? 'ЗАГРУЗКА БЫСТРЫХ' : 'ЗАГРУЗКА МУЗЫКИ')}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>
            {isQuick ? 'Максимальная длительность: 30 секунд' : 'Файлы сохраняются локально'}
          </div>
        </div>

        {pendingTracks.length === 0 ? (
          <div
            className={`upload-zone ${drag ? 'drag-over' : ''}`}
            onClick={() => audioRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files) }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#6B7280' }}>
              <IUpload />
              <span style={{ fontSize: 12 }}>Выберите аудиофайлы</span>
              <span style={{ fontSize: 10, color: '#4B5563' }}>MP3, WAV, FLAC</span>
            </div>
            <input ref={audioRef} type="file" accept="audio/*" multiple style={{ display: 'none' }}
              onChange={e => e.target.files && handleFiles(e.target.files)} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingTracks.map((track, idx) => (
              <div key={track.id} className="glass" style={{ borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                  <div
                    onClick={() => coverRef.current?.click()}
                    style={{
                      width: isMeme ? 80 : 120,
                      height: isMeme ? 80 : 120,
                      borderRadius: isMeme ? 8 : 12,
                      background: track.cover ? `url(${track.cover}) center/cover` : 'rgba(255,255,255,0.05)',
                      border: '1px dashed rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#6B7280',
                      marginBottom: 8,
                    }}
                  >
                    {!track.cover && <IImage />}
                  </div>
                  <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handleCover(idx, e.target.files[0])} />

                  <input
                    className="field"
                    value={track.name}
                    onChange={e => setPendingTracks(prev => prev.map((t, i) => i === idx ? { ...t, name: e.target.value } : t))}
                    placeholder="Название трека"
                    style={{ fontSize: 13, padding: '10px 12px', width: '100%' }}
                  />
                </div>
              </div>
            ))}

            <button className="btn-primary" onClick={submit} disabled={loading}>
              {loading ? 'Загрузка...' : `Добавить ${pendingTracks.length} ${pendingTracks.length === 1 ? 'трек' : 'треков'}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
