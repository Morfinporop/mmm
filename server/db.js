import { Pool } from 'pg'

// Используем DATABASE_URL из переменных окружения Railway (внутренний)
// Если нет - пробуем PUBLIC_URL как запасной вариант
const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.DATABASE_PUBLIC_URL ||
                     'postgresql://postgres:awbBWWjbhjPlLIxNnxcWEsJIFLwieAFw@postgres.railway.internal:5432/railway'

console.log('📊 Database URL:', DATABASE_URL.substring(0, 30) + '...')

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

// Проверка подключения
pool.on('connect', () => {
  console.log('✅ Подключено к PostgreSQL')
})

pool.on('error', (err) => {
  console.error('❌ Ошибка подключения к БД:', err.message)
})

// Автоматическое создание таблиц при подключении
export async function initDB() {
  const client = await pool.connect()
  
  try {
    console.log('📊 Создание таблиц базы данных...')
    
    await client.query('BEGIN')
    
    // Пользователи
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        avatar TEXT DEFAULT '',
        banner TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        genre VARCHAR(100) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Таблица users создана')
    
    // Треки
    await client.query(`
      CREATE TABLE IF NOT EXISTS tracks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        duration NUMERIC DEFAULT 0,
        category VARCHAR(50) DEFAULT 'Другое',
        cover TEXT DEFAULT '',
        audio_data BYTEA,
        size BIGINT DEFAULT 0,
        is_quick BOOLEAN DEFAULT FALSE,
        is_meme BOOLEAN DEFAULT FALSE,
        plays INTEGER DEFAULT 0,
        downloads INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Таблица tracks создана')
    
    // Лайки
    await client.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, track_id)
      )
    `)
    console.log('✅ Таблица likes создана')
    
    // Скачивания
    await client.query(`
      CREATE TABLE IF NOT EXISTS downloads_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
        downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Таблица downloads_log создана')
    
    // Индексы
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tracks_user_id ON tracks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tracks_category ON tracks(category);
      CREATE INDEX IF NOT EXISTS idx_tracks_created ON tracks(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
      CREATE INDEX IF NOT EXISTS idx_likes_track ON likes(track_id);
    `)
    console.log('✅ Индексы созданы')
    
    await client.query('COMMIT')
    console.log('✅ База данных полностью инициализирована')
    
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Ошибка инициализации БД:', err.message)
    throw err
  } finally {
    client.release()
  }
}

export default pool
