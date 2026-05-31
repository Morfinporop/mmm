import { useState } from 'react'
import { IClose } from '../icons'
import type { User } from '../types'
import api from '../api'

interface Props {
  onClose: () => void
  onDone: (u: User) => void
}

export function AuthModal({ onClose, onDone }: Props) {
  const [tab, setTab] = useState<'login' | 'reg'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setErr('')
    setLoading(true)

    try {
      if (tab === 'login') {
        // Вход через API
        if (!email || !pass) {
          setErr('Введите email и пароль')
          setLoading(false)
          return
        }

        const user = await api.login(email, pass)
        onDone(user)
        onClose()
      } else {
        // Регистрация через API
        if (!name.trim()) {
          setErr('Введите имя')
          setLoading(false)
          return
        }

        if (!email || !pass) {
          setErr('Заполните все поля')
          setLoading(false)
          return
        }

        if (pass.length < 6) {
          setErr('Пароль должен быть не менее 6 символов')
          setLoading(false)
          return
        }

        const user = await api.register(email, pass, name)
        onDone(user)
        onClose()
      }
    } catch (e: any) {
      setErr(e.message || 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card fade-up">
        <button className="btn-icon" style={{ position: 'absolute', top: 14, right: 14 }} onClick={onClose}>
          <IClose />
        </button>
        
        <div style={{ marginBottom: 24 }}>
          <div className="gradient-text" style={{ fontSize: 20, fontWeight: 400, letterSpacing: '0.1em', fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>
            MTRX ACCOUNT
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
            {(['login', 'reg'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                letterSpacing: '0.06em', transition: 'all 0.2s',
                background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: tab === t ? '#F5F5F5' : '#6B7280',
                borderBottom: tab === t ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
              }} disabled={loading}>
                {t === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tab === 'reg' && (
            <input className="field" placeholder="Ваше имя / псевдоним" value={name} onChange={e => setName(e.target.value)} disabled={loading} autoComplete="name" />
          )}
          <input className="field" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} autoComplete="email" />
          <input className="field" type="password" placeholder="Пароль (мин. 6 символов)" value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} disabled={loading} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
          {err && <div style={{ fontSize: 11, color: '#EF4444', letterSpacing: '0.04em' }}>{err}</div>}
          <button className="btn-primary" style={{ marginTop: 6 }} onClick={submit} disabled={loading}>
            {loading ? 'Загрузка...' : (tab === 'login' ? 'Войти' : 'Создать аккаунт')}
          </button>
          {tab === 'login' && (
            <div style={{ fontSize: 10, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>
              Нет аккаунта?{' '}
              <button onClick={() => setTab('reg')} style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer', textDecoration: 'underline' }}>
                Зарегистрироваться
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
