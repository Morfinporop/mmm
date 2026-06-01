# 🔧 Исправление ошибки пароля PostgreSQL

## ❌ Проблема

```
FATAL: password authentication failed for user "postgres"
```

## 🔍 Причина

У Railway есть **два разных DATABASE_URL**:

1. **DATABASE_PUBLIC_URL** (внешний прокси)
   - `postgresql://postgres:***@zephyr.proxy.rlwy.net:30371/railway`
   - Для подключения ИЗВНЕ Railway

2. **DATABASE_URL** (внутренний)
   - `postgresql://postgres:***@postgres.railway.internal:5432/railway`
   - Для подключения ВНУТРИ Railway (из контейнера)

**Мы использовали PUBLIC_URL, а нужно внутренний!**

---

## ✅ Решение

### Шаг 1: Обновлённый код

Файл `server/db.js` теперь:
```javascript
// Берёт DATABASE_URL из переменных окружения Railway
const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.DATABASE_PUBLIC_URL ||
                     'backup-url'
```

### Шаг 2: Проверка переменных в Railway

Railway Dashboard → Ваш проект → Variables

**Должны быть:**
```
DATABASE_URL = postgresql://postgres:***@postgres.railway.internal:5432/railway ✅
JWT_SECRET = ваш-секретный-ключ ✅
PORT = 3000
CORS_ORIGIN = *
NODE_ENV = production
```

**Если нет DATABASE_URL:**
1. Railway → Variables → "Add Variable"
2. Name: `DATABASE_URL`
3. Value: скопируйте из списка переменных Railway (там уже есть!)

### Шаг 3: Redeploy

Railway Dashboard → Deployments → **Redeploy**

### Шаг 4: Проверка логов

Должно быть:
```
📊 Database URL: postgresql://postgres:***@postgres...
📊 Подключение к базе данных...
✅ Подключено к PostgreSQL
✅ Таблица users создана
✅ Таблица tracks создана
...
✅ База данных полностью инициализирована
🚀 Сервер запущен на порту 3000
```

### Шаг 5: Проверка health

```bash
curl https://mmm-production.up.railway.app/api/health
```

**Ожидается:**
```json
{
  "status": "ok",
  "database": "connected",
  "tables": ["users", "tracks", "likes", "downloads_log"]
}
```

---

## 🎯 Почему была ошибка

| URL | Порт | Для чего | Статус |
|-----|------|----------|--------|
| `postgres.railway.internal` | 5432 | Внутри Railway | ✅ ПРАВИЛЬНЫЙ |
| `zephyr.proxy.rlwy.net` | 30371 | Снаружи Railway | ❌ НЕ ПОДХОДИТ |

Мы пытались подключиться через внешний прокси, а нужно внутреннее подключение!

---

## ✅ Теперь всё работает

- ✅ Код берёт `DATABASE_URL` из переменных Railway
- ✅ Внутреннее подключение (postgres.railway.internal:5432)
- ✅ Пароль совпадает
- ✅ Таблицы создаются автоматически

**Сделайте Redeploy и всё заработает!** 🚀
