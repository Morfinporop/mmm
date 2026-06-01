import express from 'express'
import cors from 'cors'
import pool, { initDB } from './db.js'
import authRoutes from './routes/auth.js'
import trackRoutes from './routes/tracks.js'

const app = express()
const PORT = process.env.PORT || 3000

console.log('🔧 MTRX Server запускается...')
console.log('📊 Database: Railway PostgreSQL (из переменных)')
console.log('🔐 JWT_SECRET:', process.env.JWT_SECRET ? 'настроен' : '⚠️ НЕ НАСТРОЕН!')

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

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1')
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    res.json({ 
      status: 'ok', 
      database: 'connected',
      tables: tables.rows.map(t => t.table_name),
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

// Обработка ошибок - всегда возвращаем JSON
app.use((err, req, res, next) => {
  console.error('❌ Ошибка:', err.message)
  if (err.stack) {
    console.error('Stack:', err.stack.substring(0, 500))
  }
  
  const status = err.status || 500
  res.status(status).json({ 
    error: err.message || 'Внутренняя ошибка сервера',
    status: status,
    timestamp: new Date().toISOString(),
  })
})

// 404 - всегда JSON
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Не найдено', 
    path: req.path,
    method: req.method,
  })
})

// Запуск сервера
async function start() {
  try {
    // Проверка JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️ JWT_SECRET не установлен, используем default')
      process.env.JWT_SECRET = 'mtrx-default-jwt-secret-change-in-production'
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
