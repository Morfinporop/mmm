// Определяем API URL автоматически
const getApiUrl = () => {
  // Если есть переменная окружения - используем её
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Для Railway - определяем по домену
  const host = window.location.hostname
  if (host.includes('railway.app') || host.includes('up.railway.app')) {
    return 'https://mmm-production.up.railway.app/api'
  }
  
  // Локальная разработка
  return 'http://localhost:3000/api'
}

const API_URL = getApiUrl()

console.log('🔗 API URL:', API_URL)

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

    // Не добавляем Content-Type для FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    try {
      console.log('📡 Request:', endpoint, options.method || 'GET')
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      })

      console.log('📥 Response status:', response.status)

      // Проверяем статус
      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { error: `HTTP ${response.status}` }
        }
        throw new Error(errorData.error || 'Ошибка запроса')
      }

      // Пустой ответ
      const text = await response.text()
      if (!text) {
        return {}
      }

      // Парсим JSON
      try {
        return JSON.parse(text)
      } catch (err) {
        console.error('JSON parse error:', err, 'Response:', text.substring(0, 200))
        throw new Error('Сервер вернул некорректный ответ')
      }
    } catch (err) {
      console.error('API Error:', err.message)
      if (err.message.includes('Failed to fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте интернет-соединение.')
      }
      throw err
    }
  }

  // Auth
  async register(email, password, name) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
    this.setToken(data.token)
    return data.user
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
