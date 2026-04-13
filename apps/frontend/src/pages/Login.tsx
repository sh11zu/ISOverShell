import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../stores/auth'

export function Login() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore(s => s.setAuth)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Login failed')
        return
      }

      const { token, username: user } = await res.json()
      setAuth(token, user)
      navigate('/', { replace: true })
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 360,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 32,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
            ISOverShell
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>SSH Manager</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }}>
              Username
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 14, padding: '8px 12px', borderRadius: 6,
              background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
              color: 'var(--danger)', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '9px 0',
              background: loading ? 'var(--surface-2)' : 'var(--accent)',
              border: 'none', borderRadius: 6,
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px',
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 6, color: 'var(--text)', fontSize: 13,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}
