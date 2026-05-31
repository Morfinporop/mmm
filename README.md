# MTRX — Музыкальная платформа

## 🚀 Развёртывание

### 1. База данных (Railway)

1. Создайте проект на [Railway](https://railway.app)
2. Добавьте PostgreSQL базу данных
3. Скопируйте `DATABASE_URL` из переменных окружения Railway

### 2. Бэкенд сервер

```bash
cd server
npm install

# Создайте .env файл
cp .env.example .env

# Отредактируйте .env:
# DATABASE_URL=postgresql://... (из Railway)
# JWT_SECRET=ваш-секретный-ключ-минимум-32-символа

# Запуск
npm run dev    # разработка
npm start      # продакшн
```

### 3. Фронтенд

```bash
# Установите зависимости
npm install

# Создайте .env
cp .env.example .env

# Отредактируйте .env:
# VITE_API_URL=https://ваш-сервер.railway.app/api

# Запуск
npm run dev

# Сборка
npm run build
```

### 4. Деплой на Railway

1. Подключите GitHub репозиторий к Railway
2. Добавьте переменные окружения:
   - `DATABASE_URL` (автоматически из PostgreSQL)
   - `JWT_SECRET` (случайная строка 32+ символов)
   - `PORT=3000`
   - `CORS_ORIGIN=*` (или ваш домен)

3. Deploy!

---

## 📊 Схема базы данных

```
users
├── id (UUID)
├── email (unique)
├── password_hash
├── name
├── avatar (TEXT, base64)
├── banner (TEXT, base64)
├── bio
├── genre
└── created_at

tracks
├── id (UUID)
├── user_id (FK → users)
├── name
├── artist
├── duration
├── category
├── cover (TEXT, base64)
├── audio_data (BYTEA)
├── size
├── is_quick
├── is_meme
├── plays
├── downloads
└── created_at

likes
├── id (UUID)
├── user_id (FK)
├── track_id (FK)
└── created_at

downloads_log
├── id (UUID)
├── user_id (FK, nullable)
├── track_id (FK)
└── downloaded_at
```

---

## 🔐 API Endpoints

### Auth
- `POST /api/auth/register` — Регистрация
- `POST /api/auth/login` — Вход
- `GET /api/auth/me` — Проверка токена
- `PUT /api/auth/profile` — Обновление профиля

### Tracks
- `GET /api/tracks` — Все треки
- `GET /api/tracks/my` — Мои треки
- `POST /api/tracks` — Добавить трек
- `DELETE /api/tracks/:id` — Удалить трек
- `POST /api/tracks/:id/like` — Лайк
- `DELETE /api/tracks/:id/like` — Убрать лайк
- `GET /api/tracks/:id/download` — Скачать

---

## ⚠️ Безопасность

1. **Никогда не коммитьте `.env`** в Git
2. **Смените `JWT_SECRET`** на случайную строку
3. **Используйте HTTPS** в продакшене
4. **Регулярно обновляйте** зависимости

---

## ️ Технологии

- **Frontend**: React 19, Vite, TailwindCSS 4
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Railway)
- **Auth**: JWT
- **Storage**: PostgreSQL BYTEA (для файлов)
