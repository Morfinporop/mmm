# 🔐 Исправление аутентификации

## Проблема
Можно было войти в аккаунт без регистрации, пароль не сохранялся.

## Решение

### 1. Сервер (server/routes/auth.js)

**Регистрация:**
- ✅ Пароль хэшируется через bcrypt с солью
- ✅ Сохраняется в БД в поле `password_hash`
- ✅ Проверяется уникальность email
- ✅ Минимум 6 символов в пароле

**Вход:**
- ✅ Проверяет существование пользователя в БД
- ✅ Сравнивает хэш пароля через `bcrypt.compare()`
- ✅ Возвращает ошибку если пользователь не найден
- ✅ Возвращает ошибку если пароль неверный

### 2. Фронтенд (src/components/AuthModal.tsx)

**Изменения:**
- ✅ Использует API вместо localStorage
- ✅ `api.register()` — создаёт аккаунт в БД
- ✅ `api.login()` — проверяет credentials в БД
- ✅ Сохраняет JWT токен для последующих запросов
- ✅ Валидация: email, пароль (мин. 6 символов), имя

### 3. API Клиент (src/api/index.js)

```javascript
// Регистрация
await api.register(email, password, name)
// → Создаёт пользователя в БД
// → Сохраняет токен
// → Возвращает user объект

// Вход
await api.login(email, password)
// → Проверяет в БД
// → Сравнивает хэш пароля
// → Сохраняет токен
// → Возвращает user объект

// Проверка токена
await api.getMe()
// → Проверяет JWT
// → Возвращает user или null
```

### 4. Проверка при загрузке App

Добавьте в `src/App.tsx`:

```typescript
useEffect(() => {
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('mtrx_token')
      const savedUser = localStorage.getItem('mtrx_user')
      
      if (token && savedUser) {
        const user = await api.getMe()
        if (user) {
          setUser(user)
          const tracksData = await api.getMyTracks()
          setTracks(tracksData.tracks || [])
        } else {
          localStorage.removeItem('mtrx_token')
          localStorage.removeItem('mtrx_user')
        }
      }
    } catch (err) {
      localStorage.removeItem('mtrx_token')
      localStorage.removeItem('mtrx_user')
    } finally {
      setLoading(false)
    }
  }

  checkAuth()
}, [])
```

## 🧪 Тестирование

### 1. Регистрация
```bash
curl -X POST http://localhost:3000/api/auth/register \
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

### 2. Вход с правильным паролем
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

**Ожидается:** Успешный вход с токеном

### 3. Вход с неправильным паролем
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}'
```

**Ожидается:**
```json
{ "error": "Неверный пароль" }
```

### 4. Вход без регистрации
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@test.com","password":"123456"}'
```

**Ожидается:**
```json
{ "error": "Пользователь не найден. Сначала зарегистрируйтесь." }
```

## 🗄️ База данных

Пароли хранятся в `users.password_hash` как bcrypt хэш:

```
$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

**Никогда не храните пароли в открытом виде!**

## ✅ Чеклист

- [x] Пароль хэшируется при регистрации
- [x] Пароль сохраняется в БД
- [x] Вход проверяет хэш пароля
- [x] Нельзя войти без регистрации
- [x] Нельзя войти с неправильным паролем
- [x] JWT токен сохраняется для сессии
- [x] При загрузке проверяется валидность токена

## 🚀 Запуск

```bash
# Сервер
cd server
npm install
npm run dev

# Фронтенд (в другом терминале)
npm run dev
```

Теперь:
1. **Нельзя войти** без предварительной регистрации
2. **Пароль сохраняется** в БД в хэшированном виде
3. **Вход работает** только с правильными credentials
