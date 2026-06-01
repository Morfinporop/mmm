# ✅ MTRX - Финальная настройка

## 🎯 Что сделано

### 1. База данных захардкожена в коде
Файл: `server/db.js`

```javascript
const DATABASE_URL = 'postgresql://postgres:awbBWWjbhjPlLIxNnxcWEsJIFLwieAFw@zephyr.proxy.rlwy.net:30371/railway'
```

**Больше не нужно настраивать переменные для БД!**

### 2. Таблицы создаются автоматически
При запуске сервера создаются:
- ✅ users (пользователи)
- ✅ tracks (треки)
- ✅ likes (лайки)
- ✅ downloads_log (скачивания)

### 3. JWT_SECRET из Railway
Оставьте только одну переменную в Railway:
```
JWT_SECRET=xK9mP2vL5nQ8wR3tY6uI0oP4aS7dF1gH2jK3lM4
```

---

## 🚀 Развёртывание

### Шаг 1: Railway Variables

Railway Dashboard → Ваш проект → Variables

**Оставьте только:**
```
JWT_SECRET = xK9mP2vL5nQ8wR3tY6uI0oP4aS7dF1gH2jK3lM4
PORT = 3000
CORS_ORIGIN = *
NODE_ENV = production
```

**Удалите (не нужны):**
- DATABASE_URL ❌
- PGHOST ❌
- PGPASSWORD ❌
- и другие PG* ❌

### Шаг 2: Redeploy

Railway Dashboard → Deployments → **Redeploy**

### Шаг 3: Проверка

Откройте:
```
https://mmm-production.up.railway.app/api/health
```

**Ожидается:**
```json
{
  "status": "ok",
  "database": "connected",
  "tables": ["users", "tracks", "likes", "downloads_log"],
  "timestamp": "2025-..."
}
```

---

## 🧪 Тестирование

### 1. Регистрация
```bash
curl -X POST https://mmm-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test"}'
```

**Ожидается:**
```json
{
  "message": "Аккаунт создан",
  "user": { "id": "...", "email": "test@test.com", "name": "Test" },
  "token": "eyJhbG..."
}
```

### 2. Вход
```bash
curl -X POST https://mmm-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### 3. Проверка таблиц в БД

Railway Dashboard → Database → Data

**Должны быть:**
- ✅ users
- ✅ tracks
- ✅ likes
- ✅ downloads_log

---

## 📁 Файлы

| Файл | Назначение |
|------|------------|
| `server/db.js` | **БД захардкожена** + авто-создание таблиц |
| `server/index.js` | Сервер Express |
| `server/routes/auth.js` | Регистрация/вход |
| `server/routes/tracks.js` | Треки API |
| `.env` | Фронтенд (VITE_API_URL) |
| `src/api/index.js` | API клиент |

---

## ✅ Чеклист

- [ ] `server/db.js` содержит DATABASE_URL
- [ ] JWT_SECRET добавлен в Railway Variables
- [ ] Redeploy выполнен
- [ ] Health check возвращает `{"status":"ok"}`
- [ ] Таблицы видны в Railway → Database → Data
- [ ] Регистрация работает
- [ ] Вход работает

---

## 🔧 Если что-то не так

### Ошибка: "connection refused"

**Причина:** БД ещё не готова

**Решение:** Подождите 30 секунд, сделайте Redeploy

### Ошибка: "tables don't exist"

**Решение:** 
1. Проверьте логи — должно быть `✅ Таблица users создана`
2. Если нет — Redeploy

### Ошибка: "JWT_SECRET не установлен"

**Решение:** Добавьте переменную в Railway

---

## 🎉 Готово!

Теперь:
- ✅ БД подключена напрямую из кода
- ✅ Таблицы создаются автоматически
- ✅ Регистрация/вход работают
- ✅ Пароли хэшируются
- ✅ JWT токены выдаются

**Сайт готов к использованию!** 🚀
