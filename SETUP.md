# ⚙️ Настройка MTRX с базой данных

## 🚨 СРОЧНО: Безопасность

Вы опубликовали реальные учётные данные базы данных! **Немедленно**:

1. Зайдите в [Railway Dashboard](https://railway.app)
2. Перейдите в ваш PostgreSQL проект
3. Нажмите **Variables** → **Generate New Password**
4. Скопируйте новый `DATABASE_URL`

---

## 📋 Пошаговая инструкция

### Шаг 1: База данных (Railway)

```
1. Railway.app → Ваш проект → PostgreSQL
2. Variables → скопируйте DATABASE_URL
3. Пример: postgresql://postgres:password@host:port/database
```

### Шаг 2: Настройка сервера

```bash
# Перейдите в папку сервера
cd server

# Установите зависимости
npm install

# Создайте файл окружения
cp .env.example .env

# Отредактируйте server/.env:
nano .env
```

**server/.env**:
```env
DATABASE_URL=postgresql://postgres:НОВЫЙ_ПАРОЛЬ@zephyr.proxy.rlwy.net:30371/railway
JWT_SECRET=ваш-секретный-ключ-минимум-32-символа-случайных
PORT=3000
CORS_ORIGIN=*
NODE_ENV=production
```

**Генерация JWT_SECRET**:
```bash
# Linux/Mac
openssl rand -base64 32

# Или просто случайная строка:
# xK9#mP2$vL5@nQ8&wR3!tY6*uI0^oP4
```

### Шаг 3: Запуск сервера

```bash
# Разработка (с авто-перезагрузкой)
npm run dev

# Продакшн
npm start
```

Проверка:
```bash
curl http://localhost:3000/api/health
# Ответ: {"status":"ok","database":"connected"}
```

### Шаг 4: Настройка фронтенда

```bash
# В корне проекта
cp .env.example .env

# Отредактируйте .env:
nano .env
```

**.env** (фронтенд):
```env
# Для локальной разработки:
VITE_API_URL=http://localhost:3000/api

# Для продакшена (после деплоя):
# VITE_API_URL=https://ваш-домен.railway.app/api
```

### Шаг 5: Запуск фронтенда

```bash
npm run dev
```

Откройте: http://localhost:5173

---

## 🚀 Деплой на Railway

### 1. Подключите репозиторий

```
Railway Dashboard → New Project → Deploy from GitHub repo
```

### 2. Настройте переменные окружения

В Railway Dashboard добавьте:

```
DATABASE_URL      = (автоматически из PostgreSQL)
JWT_SECRET        = ваш-секретный-ключ
PORT              = 3000
CORS_ORIGIN       = *
NODE_ENV          = production
```

### 3. Настройте Build

```
Build Command: cd server && npm install && npm run build
Start Command: cd server && npm start
```

### 4. Фронтенд

Соберите и задеплойте отдельно:

```bash
npm run build
# Загрузите dist/ на хостинг (Vercel, Netlify, или Railway Static)
```

Обновите `VITE_API_URL` на адрес сервера Railway.

---

## 🗄️ Миграции (если нужно)

Сервер автоматически создаст таблицы при первом запуске.

Если нужно сбросить:

```bash
# Подключитесь к БД
psql $DATABASE_URL

# Удалить таблицы
DROP TABLE IF EXISTS downloads_log CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

# Выйти
\q

# Перезапустить сервер
npm restart
```

---

## 🔧 Тестирование API

### Регистрация
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test"}'
```

### Вход
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### Получить треки
```bash
curl http://localhost:3000/api/tracks
```

---

## 📁 Структура файлов

```
mtrx-app/
├── server/
│   ├── index.js           # Главный файл сервера
│   ├── db.js              # Подключение к PostgreSQL
│   ├── routes/
│   │   ├── auth.js        # Регистрация/вход
│   │   └── tracks.js      # Треки
│   ├── middleware/
│   │   └── auth.js        # JWT проверка
│   ├── package.json
│   └── .env               # (не коммитить!)
├── src/
│   ├── api/
│   │   └── index.js       # API клиент
│   └── ...
├── .env                   # (не коммитить!)
├── .env.example
├── package.json
└── README.md
```

---

## ️‍️ Решение проблем

### Ошибка подключения к БД
```
❌ Ошибка: password authentication failed
```
**Решение**: Проверьте `DATABASE_URL` в `server/.env`

### Ошибка CORS
```
❌ Access to fetch blocked by CORS policy
```
**Решение**: Добавьте `CORS_ORIGIN=http://localhost:5173` в `server/.env`

### JWT ошибка
```
❌ Неверный токен
```
**Решение**: Проверьте `JWT_SECRET` (одинаковый в server/.env)

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи сервера
2. Проверьте подключение к БД
3. Убедитесь что все переменные окружения установлены
