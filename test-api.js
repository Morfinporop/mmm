// Тест API сервера
const API_URL = process.env.API_URL || 'http://localhost:3000/api'

console.log('🧪 Тестирование API:', API_URL)

async function test() {
  try {
    // 1. Health check
    console.log('\n1️⃣ Health check...')
    const health = await fetch(`${API_URL}/health`)
    console.log('Status:', health.status)
    const healthData = await health.json()
    console.log('✅', healthData)

    // 2. Регистрация
    console.log('\n2️⃣ Регистрация...')
    const email = `test${Date.now()}@test.com`
    const register = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: '123456',
        name: 'Test User'
      })
    })
    console.log('Status:', register.status)
    const registerData = await register.json()
    console.log('✅', registerData)

    if (!registerData.token) {
      throw new Error('No token received')
    }

    // 3. Вход
    console.log('\n3️⃣ Вход...')
    const login = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: '123456'
      })
    })
    console.log('Status:', login.status)
    const loginData = await login.json()
    console.log('✅', loginData)

    // 4. Проверка токена
    console.log('\n4️⃣ Проверка токена...')
    const me = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${registerData.token}` }
    })
    console.log('Status:', me.status)
    const meData = await me.json()
    console.log('✅', meData)

    console.log('\n✅ Все тесты пройдены!')
  } catch (err) {
    console.error('\n❌ Ошибка теста:', err.message)
    if (err.message.includes('Failed to fetch')) {
      console.error('\n💡 Сервер недоступен. Проверьте:')
      console.error('   1. Запущен ли сервер (npm run dev)')
      console.error('   2. Правильный ли URL (API_URL)')
      console.error('   3. CORS настройки')
    } else if (err.message.includes('Unexpected end of JSON')) {
      console.error('\n💡 Сервер вернул пустой ответ. Проверьте логи сервера.')
    }
    process.exit(1)
  }
}

test()
