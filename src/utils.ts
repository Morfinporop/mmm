import type { Track, User } from './types'

export const fmtTime = (s: number) => {
  if (!isFinite(s) || s < 0) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export const fmtSize = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} КБ` : `${(b / (1024 * 1024)).toFixed(1)} МБ`

export function parseArtist(name: string): { artist: string; title: string } {
  const clean = name.replace(/\.[^/.]+$/, '')
  const parts = clean.split(/\s*[-–—]\s*/)
  if (parts.length >= 2) return { artist: parts[0].trim(), title: parts.slice(1).join(' — ').trim() }
  return { artist: '', title: clean }
}

const TRACK_KEY = 'mtrx_tracks_v4'
const USER_KEY = 'mtrx_user_v1'

export const loadTracks = (): Track[] => {
  try { return JSON.parse(localStorage.getItem(TRACK_KEY) || '[]') } catch { return [] }
}

export const saveTracks = (t: Track[]) => {
  try { localStorage.setItem(TRACK_KEY, JSON.stringify(t)) } catch {}
}

export const loadUser = (): User | null => {
  try { const r = localStorage.getItem(USER_KEY); return r ? JSON.parse(r) : null } catch { return null }
}

export const saveUser = (u: User) => localStorage.setItem(USER_KEY, JSON.stringify(u))

export const toBase64 = (file: File): Promise<string> =>
  new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target!.result as string); r.readAsDataURL(file) })
