import express from 'express'
import pool from '../db.js'
import { authenticateToken, optionalAuth } from '../middleware/auth.js'
import multer from 'multer'

const router = express.Router()

// Multer для загрузки файлов (в памяти)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
})

// Получить все треки (публично)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, is_quick, is_meme, limit = 100, offset = 0 } = req.query

    let where = []
    let params = []
    let paramIndex = 1

    if (category) {
      where.push(`category = $${paramIndex}`)
      params.push(category)
      paramIndex++
    }

    if (is_quick === 'true') {
      where.push('is_quick = TRUE')
    }

    if (is_meme === 'true') {
      where.push('is_meme = TRUE')
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''

    const result = await pool.query(
      `SELECT 
        t.id, t.name, t.artist, t.duration, t.category, 
        t.cover, t.size, t.is_quick, t.is_meme, t.plays, t.downloads, t.created_at,
        u.id as user_id, u.name as user_name, u.avatar as user_avatar,
        CASE WHEN l.id IS NOT NULL THEN TRUE ELSE FALSE END as is_liked
       FROM tracks t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN likes l ON l.track_id = t.id AND l.user_id = $${paramIndex}
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`,
      [...params, req.user?.id || null, parseInt(limit), parseInt(offset)]
    )

    const tracks = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      artist: row.artist,
      duration: parseFloat(row.duration),
      category: row.category,
      cover: row.cover,
      size: parseInt(row.size),
      isQuick: row.is_quick,
      isMeme: row.is_meme,
      plays: row.plays,
      downloads: row.downloads,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        avatar: row.user_avatar,
      },
      isLiked: row.is_liked,
    }))

    res.json({ tracks })
  } catch (err) {
    console.error('Ошибка получения треков:', err)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Получить треки пользователя
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, artist, duration, category, cover, size, is_quick, is_meme, plays, downloads, created_at
       FROM tracks WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    )

    const tracks = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      artist: row.artist,
      duration: parseFloat(row.duration),
      category: row.category,
      cover: row.cover,
      size: parseInt(row.size),
      isQuick: row.is_quick,
      isMeme: row.is_meme,
      plays: row.plays,
      downloads: row.downloads,
      createdAt: row.created_at,
    }))

    res.json({ tracks })
  } catch (err) {
    console.error('Ошибка получения треков пользователя:', err)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Добавить трек
router.post('/', authenticateToken, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]), async (req, res) => {
  try {
    const { name, artist, category, duration, isQuick, isMeme } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Название обязательно' })
    }

    let coverData = null
    let audioData = null

    // Обработка обложки
    if (req.files.cover?.[0]) {
      coverData = `data:${req.files.cover[0].mimetype};base64,${req.files.cover[0].buffer.toString('base64')}`
    }

    // Обработка аудио
    if (req.files.audio?.[0]) {
      audioData = req.files.audio[0].buffer
    }

    const result = await pool.query(
      `INSERT INTO tracks 
       (user_id, name, artist, duration, category, cover, audio_data, size, is_quick, is_meme)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, artist, duration, category, cover, size, is_quick, is_meme, created_at`,
      [
        req.user.id,
        name,
        artist || req.user.name,
        parseFloat(duration) || 0,
        category || 'Другое',
        coverData,
        audioData,
        req.files.audio?.[0]?.size || 0,
        isQuick === 'true',
        isMeme === 'true',
      ]
    )

    res.status(201).json({
      message: 'Трек добавлен',
      track: result.rows[0],
    })
  } catch (err) {
    console.error('Ошибка добавления трека:', err)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Удалить трек
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Проверка что трек принадлежит пользователю
    const check = await pool.query('SELECT user_id FROM tracks WHERE id = $1', [req.params.id])
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Трек не найден' })
    }

    if (check.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав на удаление' })
    }

    await pool.query('DELETE FROM tracks WHERE id = $1', [req.params.id])

    res.json({ message: 'Трек удалён' })
  } catch (err) {
    console.error('Ошибка удаления трека:', err)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Лайк трека
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO likes (user_id, track_id) VALUES ($1, $2)
       ON CONFLICT (user_id, track_id) DO NOTHING`,
      [req.user.id, req.params.id]
    )

    res.json({ message: 'Лайк поставлен' })
  } catch (err) {
    console.error('Ошибка лайка:', err)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Убрать лайк
router.delete('/:id/like', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM likes WHERE user_id = $1 AND track_id = $2', [
      req.user.id,
      req.params.id,
    ])

    res.json({ message: 'Лайк убран' })
  } catch (err) {
    console.error('Ошибка удаления лайка:', err)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Скачать трек (увеличивает счётчик)
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT audio_data, name FROM tracks WHERE id = $1',
      [req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Трек не найден' })
    }

    const track = result.rows[0]

    // Увеличиваем счётчик скачиваний
    await pool.query('UPDATE tracks SET downloads = downloads + 1 WHERE id = $1', [req.params.id])

    // Логируем скачивание
    await pool.query(
      'INSERT INTO downloads_log (user_id, track_id) VALUES ($1, $2)',
      [req.user.id, req.params.id]
    )

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Disposition', `attachment; filename="${track.name}.mp3"`)
    res.send(track.audio_data)
  } catch (err) {
    console.error('Ошибка скачивания:', err)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

export default router
