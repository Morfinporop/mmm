import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { authenticateToken } from '../middleware/auth.js'
import dotenv from 'dotenv'

dotenv.config()
const router = express.Router()

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Заполните все поля' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' })
    }

    // Проверка существующего пользователя
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' })
    }

    // Хэширование пароля (bcrypt с солью)
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    console.log('Регистрация:', { email, name, passwordHash: passwordHash.substring(0, 20) + '...' })

    // Создание пользователя
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, bio) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, avatar, banner, bio, genre, created_at`,
      [email, passwordHash, name, 'Новый пользователь MTRX!']
    )

    const user = result.rows[0]

    // Генерация JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    console.log('Пользователь создан:', user.id)

    res.status(201).json({
      message: 'Аккаунт создан',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || '',
        banner: user.banner || '',
        bio: user.bio,
        genre: user.genre || '',
      },
      token,
    })
  } catch (err) {
    console.error('Ошибка регистрации:', err.message, err.stack)
    res.status(500).json({ error: 'Ошибка сервера: ' + err.message })
  }
})

// Вход
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Введите email и пароль' })
    }

    console.log('Попытка входа:', { email })

    // Поиск пользователя в БД
    const result = await pool.query(
      'SELECT id, email, password_hash, name, avatar, banner, bio, genre FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      console.log('Пользователь не найден:', email)
      return res.status(401).json({ error: 'Пользователь не найден. Сначала зарегистрируйтесь.' })
    }

    const user = result.rows[0]
    console.log('Пользователь найден, проверка пароля...')

    // Проверка пароля через bcrypt
    const valid = await bcrypt.compare(password, user.password_hash)
    
    if (!valid) {
      console.log('Неверный пароль для:', email)
      return res.status(401).json({ error: 'Неверный пароль' })
    }

    console.log('Вход успешен:', email)

    // Генерация JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      message: 'Вход выполнен',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || '',
        banner: user.banner || '',
        bio: user.bio || '',
        genre: user.genre || '',
      },
      token,
    })
  } catch (err) {
    console.error('Ошибка входа:', err.message, err.stack)
    res.status(500).json({ error: 'Ошибка сервера: ' + err.message })
  }
})

// Проверка токена
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, avatar, banner, bio, genre, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    res.json({ user: result.rows[0] })
  } catch (err) {
    console.error('Ошибка проверки токена:', err)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Обновление профиля
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, bio, genre, avatar, banner } = req.body

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           bio = COALESCE($2, bio), 
           genre = COALESCE($3, genre),
           avatar = COALESCE($4, avatar),
           banner = COALESCE($5, banner),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, email, name, avatar, banner, bio, genre`,
      [name, bio, genre, avatar, banner, req.user.id]
    )

    res.json({ user: result.rows[0] })
  } catch (err) {
    console.error('Ошибка обновления профиля:', err)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

export default router
