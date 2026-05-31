import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pool, { initDB } from './db.js'
import authRoutes from './routes/auth.js'
import trackRoutes from './routes/tracks.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

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
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'connected' })
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected' })
  }
})

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка:', err)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Не найдено' })
})

// Запуск сервера
async function start() {
  try {
    // Инициализация БД
    await initDB()

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Сервер запущен на порту ${PORT}`)
      console.log(`📊 Health: http://localhost:${PORT}/api/health\n`)
    })
  } catch (err) {
    console.error('❌ Ошибка запуска:', err.message)
    process.exit(1)
  }
}

start()
