# 🔧 Отладка "Failed to fetch" и "Unexpected end of JSON"

## 🚨 Симптомы

```
Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

или

```
Failed to fetch
```

---

## 🔍 Диагностика

### Шаг 1: Проверка доступности сервера

```bash
# Health check
curl https://mmm-production.up.railway.app/api/health
```

**Ожидается:**
```json
{"status":"ok","database":"connected",...}
```

**Если ошибка:**
- Сервер не запущен
- Неправильный URL
- Брандмауэр блокирует

---

### Шаг 2: Проверка логов сервера

Railway Dashboard → Deployments → View Logs

**Ищите:**
```
✅ База данных полностью инициализирована
🚀 Сервер запущен на порту 3000
```

**Если видите ошибки:**
- `DATABASE_URL не установлен` → добавьте переменную
- `JWT_SECRET не установлен` → добавьте переменную
- `Error: connect ECONNREFUSED` → БД недоступна

---

### Шаг 3: Тест регистрации

```bash
curl -X POST https://mmm-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test"}' \
  -v
```

**Флаг `-v` покажет детали ответа.**

**Ожидается:**
```
< HTTP/2 201
< content-type: application/json
...
{"message":"Аккаунт создан",...}
```

**Если пусто:**
- Сервер падает во время запроса
- Ошибка в middleware
- Timeout БД

---

### Шаг 4: Проверка CORS

Откройте консоль браузера (F12) и выполните:

```javascript
fetch('https://mmm-production.up.railway.app/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Если CORS ошибка:**
```
Access to fetch blocked by CORS policy
```

**Решение:**
1. Railway → Variables → `CORS_ORIGIN=*`
2. Redeploy

---

### Шаг 5: Запуск тестового скрипта

```bash
# Локально
API_URL=http://localhost:3000/api node test-api.js

# Railway
API_URL=https://mmm-production.up.railway.app/api node test-api.js
```

---

## ✅ Решения

### Проблема: Пустой ответ сервера

**Причина:** Сервер падает до отправки ответа

**Решение:**
1. Проверьте логи Railway
2. Ищите `Error:` или `Exception`
3. Частые причины:
   - Нет `DATABASE_URL`
   - Нет `JWT_SECRET`
   - БД недоступна
   - Порт занят

---

### Проблема: Failed to fetch

**Причина:** Сеть/сервер недоступен

**Решение:**
1. Проверьте URL в `.env`:
   ```env
   VITE_API_URL=https://mmm-production.up.railway.app/api
   ```
2. Проверьте что сервер запущен:
   ```
   https://mmm-production.up.railway.app/api/health
   ```
3. Проверьте CORS в логах сервера

---

### Проблема: JSON parse error

**Причина:** Сервер возвращает HTML вместо JSON

**Решение:**
1. Проверьте что endpoint правильный (`/api/auth/register`)
2. Проверьте что нет редиректа на login страницу
3. Проверьте Content-Type заголовок в ответе

---

### Проблема: Таймаут

**Причина:** БД медленно отвечает

**Решение:**
1. Railway → Database → проверьте метрики
2. Увеличьте timeout в `server/db.js`:
   ```javascript
   const pool = new Pool({
     connectionTimeoutMillis: 10000,  // 10 сек
     idleTimeoutMillis: 30000,
   })
   ```

---

## 🧪 Быстрые тесты

### 1. Health check
```bash
curl https://mmm-production.up.railway.app/api/health
```

### 2. Регистрация
```bash
curl -X POST https://mmm-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test"}'
```

### 3. Вход
```bash
curl -X POST https://mmm-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### 4. Проверка токена
```bash
curl https://mmm-production.up.railway.app/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📞 Если ничего не помогает

1. **Перезапустите сервер:**
   - Railway → Deployments → Restart

2. **Пересоздайте таблицы:**
   - Railway → Database → SQL
   ```sql
   DROP TABLE IF EXISTS downloads_log CASCADE;
   DROP TABLE IF EXISTS likes CASCADE;
   DROP TABLE IF EXISTS tracks CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```
   - Restart сервера

3. **Проверьте переменные:**
   ```
   DATABASE_URL ✅
   JWT_SECRET ✅
   PORT=3000 ✅
   CORS_ORIGIN=* ✅
   NODE_ENV=production ✅
   ```

4. **Соберите заново:**
   ```bash
   npm run build
   ```

---

## ✅ Чеклист успеха

- [ ] Health check возвращает `{"status":"ok"}`
- [ ] В логах: `✅ База данных полностью инициализирована`
- [ ] Регистрация создаёт пользователя в БД
- [ ] Вход возвращает токен
- [ ] CORS настроен (`*` или ваш домен)
- [ ] Фронтенд использует правильный `VITE_API_URL`
