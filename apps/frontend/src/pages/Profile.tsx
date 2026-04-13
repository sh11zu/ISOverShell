import { useState } from 'react'
import { useAuthStore } from '../stores/auth'
import { apiJson } from '../lib/api'

export function Profile() {
  const username = useAuthStore(s => s.username)

  const [current,  setCurrent]  = useState('')
  const [next,     setNext]     = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (next !== confirm) {
      setError('New passwords do not match')
      return
    }
    if (next.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const res = await apiJson('/api/auth/password', 'PATCH', {
        currentPassword: current,
        newPassword:     next,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Update failed')
        return
      }

      setSuccess(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 480 }}>
      <h2 style={{ margin: '0 0 28px', fontWeight: 600, fontSize: 18 }}>Profile</h2>

      {/* User info */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '16px 18px', marginBottom: 28,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'color-mix(in srgb, var(--accent) 20%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: 'var(--accent)',
          flexShrink: 0,
        }}>
          {username?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{username}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Administrator</div>
        </div>
      </div>

      {/* Change password */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 8, overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--border)',
          fontSize: 13, fontWeight: 600,
        }}>
          Change password
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '18px' }}>
          {[
            { label: 'Current password', value: current, set: setCurrent, auto: 'current-password' },
            { label: 'New password',     value: next,    set: setNext,    auto: 'new-password' },
            { label: 'Confirm new password', value: confirm, set: setConfirm, auto: 'new-password' },
          ].map(({ label, value, set, auto }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }}>
                {label}
              </label>
              <input
                type="password"
                value={value}
                onChange={e => set(e.target.value)}
                autoComplete={auto}
                required
                style={inputStyle}
              />
            </div>
          ))}

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

          {success && (
            <div style={{
              marginBottom: 14, padding: '8px 12px', borderRadius: 6,
              background: 'color-mix(in srgb, var(--success) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
              color: 'var(--success)', fontSize: 13,
            }}>
              Password updated successfully.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '7px 20px',
                background: loading ? 'var(--surface-2)' : 'var(--accent)',
                border: 'none', borderRadius: 6,
                color: '#fff', fontSize: 13, fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Saving…' : 'Update password'}
            </button>
          </div>
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
