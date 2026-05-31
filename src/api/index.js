// Определяем API URL автоматически
const getApiUrl = () => {
  // Если есть переменная окружения - используем её
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Для Railway - определяем по домену
  const host = window.location.hostname
  if (host.includes('railway.app') || host.includes('up.railway.app')) {
    return '/api'  // Прокси через Vite
  }
  
  // Локальная разработка
  return 'http://localhost:3000/api'
}

const API_URL = getApiUrl()

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('mtrx_token')
  }

  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('mtrx_token', token)
    } else {
      localStorage.removeItem('mtrx_token')
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка запроса')
    }

    return data
  }

  // Auth
  async register(email, password, name) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
      headers: { 'Content-Type': 'application/json' },
    })
    this.setToken(data.token)
    return data.user
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
    })
    this.setToken(data.token)
    return data.user
  }

  async getMe() {
    try {
      const data = await this.request('/auth/me')
      return data.user
    } catch {
      this.setToken(null)
      return null
    }
  }

  async updateProfile(profile) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  async logout() {
    this.setToken(null)
  }

  // Tracks
  async getTracks(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/tracks${queryString ? `?${queryString}` : ''}`)
  }

  async getMyTracks() {
    return this.request('/tracks/my')
  }

  async uploadTrack(formData) {
    return this.request('/tracks', {
      method: 'POST',
      body: formData,
    })
  }

  async deleteTrack(id) {
    return this.request(`/tracks/${id}`, { method: 'DELETE' })
  }

  async likeTrack(id) {
    return this.request(`/tracks/${id}/like`, { method: 'POST' })
  }

  async unlikeTrack(id) {
    return this.request(`/tracks/${id}/like`, { method: 'DELETE' })
  }

  async downloadTrack(id) {
    const response = await fetch(`${API_URL}/tracks/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Ошибка скачивания')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `track_${id}.mp3`
    a.click()
    window.URL.revokeObjectURL(url)
  }
}

export const api = new ApiClient()
export default api
