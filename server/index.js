import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pool, { initDB } from './db.js'
import authRoutes from './routes/auth.js'
import trackRoutes from './routes/tracks.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

console.log('🔧 Конфигурация:', {
  PORT,
  CORS: process.env.CORS_ORIGIN,
  DB: process.env.DATABASE_URL ? 'подключено' : 'НЕ ПОДКЛЮЧЕНО',
  JWT: process.env.JWT_SECRET ? 'настроен' : 'НЕ НАСТРОЕН',
})

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/tracks', trackRoutes)

// Health check с детальной информацией
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1')
    res.json({ 
      status: 'ok', 
      database: 'connected',
      tables: 'initialized',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Health check failed:', err.message)
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    })
  }
})

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка:', err.message)
  console.error('Stack:', err.stack)
  res.status(500).json({ error: 'Внутренняя ошибка сервера', details: err.message })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Не найдено', path: req.path })
})

// Запуск сервера
async function start() {
  try {
    // Проверка переменных окружения
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL не установлен! Проверьте server/.env')
    }
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET не установлен! Проверьте server/.env')
    }

    // Инициализация БД
    console.log('📊 Подключение к базе данных...')
    await initDB()
    console.log('✅ База данных готова')

    // Проверка таблиц
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    console.log('📋 Таблицы:', tables.rows.map(t => t.table_name).join(', '))

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Сервер запущен на порту ${PORT}`)
      console.log(`📊 Health: http://localhost:${PORT}/api/health`)
      console.log(`🔗 API: http://localhost:${PORT}/api\n`)
    })
  } catch (err) {
    console.error('❌ Ошибка запуска:', err.message)
    console.error('Stack:', err.stack)
    process.exit(1)
  }
}

start()
