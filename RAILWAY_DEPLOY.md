# 🚀 Развёртывание на Railway

## ✅ Шаг 1: Проверка переменных окружения

В Railway Dashboard у вас уже есть 8 переменных. Убедитесь что есть:

```
DATABASE_URL = postgresql://postgres:***@zephyr.proxy.rlwy.net:30371/railway
JWT_SECRET = ваша-случайная-строка-32-символа
PORT = 3000
CORS_ORIGIN = *
NODE_ENV = production
```

**Если нет JWT_SECRET — добавьте:**
```
JWT_SECRET=xK9mP2vL5nQ8wR3tY6uI0oP4aS7dF1gH2jK3lM4
```

---

## ✅ Шаг 2: Проверка подключения

Откройте в браузере:
```
https://mmm-production.up.railway.app/api/health
```

**Ожидается:**
```json
{
  "status": "ok",
  "database": "connected",
  "tables": "initialized",
  "timestamp": "2025-..."
}
```

**Если ошибка:**
- Проверьте логи в Railway Dashboard → Deployments → View Logs
- Убедитесь что `DATABASE_URL` правильный

---

## ✅ Шаг 3: Проверка таблиц

В Railway Dashboard → Database → Data

Должны быть таблицы:
- ✅ users
- ✅ tracks
- ✅ likes
- ✅ downloads_log

**Если таблиц нет:**
1. Проверьте логи сервера
2. Должно быть: `✅ Таблицы созданы успешно`

---

## ✅ Шаг 4: Тестирование регистрации

```bash
curl -X POST https://mmm-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test"}'
```

**Ожидается:**
```json
{
  "message": "Аккаунт создан",
  "user": { "id": "...", "email": "test@test.com", ... },
  "token": "eyJhbG..."
}
```

---

## ✅ Шаг 5: Настройка фронтенда

Отредактируйте `.env` в корне проекта:

```env
# Замените на ваш Railway домен
VITE_API_URL=https://mmm-production.up.railway.app/api
```

Затем:
```bash
npm run build
```

Загрузите `dist/` на хостинг (Vercel, Netlify, или Railway Static).

---

## 🔧 Решение проблем

### Ошибка: "Failed to fetch"

**Причина:** Фронтенд стучится не на тот URL

**Решение:**
1. Проверьте `.env` → `VITE_API_URL`
2. Убедитесь что сервер запущен: `https://mmm-production.up.railway.app/api/health`
3. Проверьте CORS в логах сервера

### Ошибка: "DATABASE_URL не установлен"

**Причина:** Переменная не передана серверу

**Решение:**
1. Railway Dashboard → Variables
2. Убедитесь что `DATABASE_URL` есть
3. Перезапустите Deployment (Redeploy)

### Ошибка: "JWT_SECRET не установлен"

**Решение:**
1. Добавьте переменную в Railway:
   ```
   JWT_SECRET=xK9mP2vL5nQ8wR3tY6uI0oP4aS7dF1gH2jK3lM4
   ```
2. Redeploy

### Таблицы не создаются

**Решение:**
1. Проверьте логи — должна быть ошибка SQL
2. Попробуйте создать вручную через Railway → Database → SQL:
   ```sql
   DROP TABLE IF EXISTS downloads_log CASCADE;
   DROP TABLE IF EXISTS likes CASCADE;
   DROP TABLE IF EXISTS tracks CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```
3. Redeploy — сервер создаст таблицы заново

---

## 📊 Логи сервера

Railway Dashboard → Deployments → View Logs

**Должно быть:**
```
🔧 Конфигурация: { PORT: 3000, CORS: '*', DB: 'подключено', JWT: 'настроен' }
📊 Подключение к базе данных...
✅ Подключено к PostgreSQL
✅ Таблицы созданы успешно
📋 Таблицы: users, tracks, likes, downloads_log
✅ База данных готова
🚀 Сервер запущен на порту 3000
```

---

## ✅ Финальная проверка

1. ✅ Сервер запущен (health check OK)
2. ✅ БД подключена (tables created)
3. ✅ Регистрация работает (curl тест)
4. ✅ Вход работает (с правильным паролем)
5. ✅ Фронтенд подключён (VITE_API_URL правильный)
