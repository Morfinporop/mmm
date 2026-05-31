# 🚀 Быстрый старт MTRX на Railway

## ✅ Всё работает автоматически!

Сервер **сам создаст все таблицы** при первом запуске. Ничего делать не нужно!

---

## 📋 Шаг 1: Проверка переменных в Railway

Railway Dashboard → Ваш проект → Variables

**Должны быть:**

```
DATABASE_URL = postgresql://postgres:***@zephyr.proxy.rlwy.net:30371/railway ✅
JWT_SECRET = xK9mP2vL5nQ8wR3tY6uI0oP4aS7dF1gH2jK3lM4 ⚠️
PORT = 3000
CORS_ORIGIN = *
NODE_ENV = production
```

**Если нет JWT_SECRET — добавьте:**
```
Name: JWT_SECRET
Value: xK9mP2vL5nQ8wR3tY6uI0oP4aS7dF1gH2jK3lM4
```

---

## 📋 Шаг 2: Проверка что сервер запустился

Railway Dashboard → Deployments → View Logs

**Должно быть:**
```
🔧 Конфигурация: { PORT: 3000, CORS: '*', DB: 'подключено', JWT: 'настроен' }
📊 Создание таблиц базы данных...
✅ Таблица users создана
✅ Таблица tracks создана
✅ Таблица likes создана
✅ Таблица downloads_log создана
✅ Индексы созданы
✅ База данных полностью инициализирована
🚀 Сервер запущен на порту 3000
```

---

## 📋 Шаг 3: Проверка API

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

---

## 📋 Шаг 4: Тест регистрации

Откройте консоль браузера (F12) на вашем сайте и выполните:

```javascript
fetch('https://mmm-production.up.railway.app/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@test.com',
    password: '123456',
    name: 'Test User'
  })
})
.then(r => r.json())
.then(console.log)
```

**Ожидается:**
```json
{
  "message": "Аккаунт создан",
  "user": { "id": "...", "email": "test@test.com", "name": "Test User" },
  "token": "eyJhbG..."
}
```

---

## 📋 Шаг 5: Проверка таблиц в БД

Railway Dashboard → Database → Data

**Должны быть таблицы:**
- ✅ users
- ✅ tracks  
- ✅ likes
- ✅ downloads_log

---

## 📋 Шаг 6: Настройка фронтенда

Файл `.env` в корне проекта уже настроен:

```env
VITE_API_URL=https://mmm-production.up.railway.app/api
```

**Соберите фронтенд:**
```bash
npm run build
```

**Загрузите `dist/` на хостинг** (Vercel, Netlify, или Railway Static).

---

## 🔧 Решение проблем

### ❌ "Failed to fetch"

**Причина:** Фронтенд стучится не туда

**Решение:**
1. Проверьте `.env` → `VITE_API_URL`
2. Убедитесь что сервер доступен: `https://mmm-production.up.railway.app/api/health`
3. Проверьте CORS в логах

### ❌ "DATABASE_URL не установлен"

**Решение:**
1. Railway → Variables → проверьте `DATABASE_URL`
2. Redeploy

### ❌ "JWT_SECRET не установлен"

**Решение:**
1. Добавьте переменную:
   ```
   JWT_SECRET=xK9mP2vL5nQ8wR3tY6uI0oP4aS7dF1gH2jK3lM4
   ```
2. Redeploy

### ❌ Таблицы не создаются

**Решение:**
1. Проверьте логи — должна быть ошибка SQL
2. Railway → Database → SQL → выполните:
   ```sql
   DROP TABLE IF EXISTS downloads_log CASCADE;
   DROP TABLE IF EXISTS likes CASCADE;
   DROP TABLE IF EXISTS tracks CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```
3. Redeploy — сервер создаст таблицы заново

---

## ✅ Финальный чеклист

- [ ] JWT_SECRET добавлен в Railway Variables
- [ ] Сервер запустился (логи показывают "✅ База данных полностью инициализирована")
- [ ] Health check возвращает `{"status":"ok"}`
- [ ] Таблицы видны в Railway → Database → Data
- [ ] Регистрация работает (curl тест успешен)
- [ ] Фронтенд собран (`npm run build`)

---

## 🎉 Готово!

Теперь:
- ✅ Таблицы создаются **автоматически** при старте сервера
- ✅ Регистрация/вход работают через БД
- ✅ Пароли хэшируются через bcrypt
- ✅ JWT токены выдаются на 30 дней
- ✅ Фронтенд подключён к Railway API
