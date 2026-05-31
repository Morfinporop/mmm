export interface Track {
  id: string
  name: string
  artist: string
  duration: number
  b64: string
  size: number
  addedAt: number
  category: string
  cover?: string
  isQuick?: boolean
}

export interface User {
  name: string
  email: string
  avatar: string
  banner: string
  bio: string
  genre: string
}

export const CATEGORIES = ['Все', 'Рэп', 'Поп', 'Рок', 'Электронная', 'Джаз', 'Классика', 'Другое']
