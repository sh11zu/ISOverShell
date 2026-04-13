import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Monitor, Plus, Trash2, Pencil } from 'lucide-react'
import { useSessionStore } from '../stores/sessions'
import { api, apiJson } from '../lib/api'
import type { Host } from '@isovershell/types'

export function Dashboard() {
  const qc = useQueryClient()
  const openSession = useSessionStore(s => s.openSession)
  const [showAdd, setShowAdd] = useState(false)
  const [editHost, setEditHost] = useState<Host | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const { data: hosts = [] } = useQuery<Host[]>({
    queryKey: ['hosts'],
    queryFn: () => api('/api/hosts').then(r => r.json()),
  })

  const deleteHost = useMutation({
    mutationFn: (id: number) => api(`/api/hosts/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hosts'] }),
  })

  const allTags = [...new Set(hosts.flatMap(h => h.tags))].sort()
  const filteredHosts = activeTag ? hosts.filter(h => h.tags.includes(activeTag)) : hosts

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>Hosts</h2>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', background: 'var(--accent)',
            border: 'none', borderRadius: 6, color: '#fff',
            cursor: 'pointer', fontSize: 13, fontWeight: 500,
          }}
        >
          <Plus size={14} /> Add Host
        </button>
      </div>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          <TagPill
            label="All"
            active={activeTag === null}
            onClick={() => setActiveTag(null)}
          />
          {allTags.map(tag => (
            <TagPill
              key={tag}
              label={tag}
              active={activeTag === tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            />
          ))}
        </div>
      )}

      {hosts.length === 0 ? (
        <EmptyState onAdd={() => setShowAdd(true)} />
      ) : filteredHosts.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 24 }}>
          No hosts with tag "{activeTag}".
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {filteredHosts.map(host => (
            <HostCard
              key={host.id}
              host={host}
              onConnect={() => openSession({ kind: 'terminal', hostId: host.id, label: host.label, hostname: host.hostname })}
              onEdit={() => setEditHost(host)}
              onDelete={() => deleteHost.mutate(host.id)}
            />
          ))}
        </div>
      )}

      {showAdd && <AddHostModal onClose={() => setShowAdd(false)} />}
      {editHost && <EditHostModal host={editHost} onClose={() => setEditHost(null)} />}
    </div>
  )
}

// ─── TagPill ──────────────────────────────────────────────────────────────────

function TagPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500,
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

// ─── HostCard ─────────────────────────────────────────────────────────────────

function HostCard({
  host, onConnect, onEdit, onDelete,
}: {
  host: Host
  onConnect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 8, padding: 14, cursor: 'pointer', position: 'relative',
        transition: 'border-color 0.15s',
      }}
      onClick={onConnect}
      onMouseEnter={e => { setHovered(true); e.currentTarget.style.borderColor = 'var(--accent)' }}
      onMouseLeave={e => { setHovered(false); e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {/* Action buttons */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        display: 'flex', gap: 2,
        opacity: hovered ? 1 : 0, transition: 'opacity 0.15s',
      }}>
        <button
          onClick={e => { e.stopPropagation(); onEdit() }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 4, borderRadius: 4,
            display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--surface-2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
          title="Edit"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 4, borderRadius: 4,
            display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--surface-2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 6,
          background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Monitor size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <span style={{ fontWeight: 600, fontSize: 14, paddingRight: hovered ? 56 : 0, transition: 'padding 0.15s' }}>
          {host.label}
        </span>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {host.username}@{host.hostname}:{host.port}
      </div>

      {host.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {host.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 99,
              background: 'var(--surface-2)', color: 'var(--text-muted)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: 300, color: 'var(--text-muted)',
    }}>
      <Monitor size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
      <p style={{ margin: '0 0 4px', fontSize: 15, color: 'var(--text)' }}>No hosts yet</p>
      <p style={{ margin: '0 0 20px', fontSize: 13 }}>Add your first SSH host to get started</p>
      <button
        onClick={onAdd}
        style={{
          padding: '8px 18px', background: 'var(--accent)', border: 'none',
          borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13,
        }}
      >
        Add Host
      </button>
    </div>
  )
}

// ─── Shared form helpers ──────────────────────────────────────────────────────

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
        {label}
      </label>
      <style>{`
        .iss-form input, .iss-form select, .iss-form textarea {
          width: 100%; padding: 7px 10px;
          background: var(--bg); border: 1px solid var(--border);
          border-radius: 5px; color: var(--text); font-size: 13px;
          font-family: inherit; outline: none; box-sizing: border-box;
        }
        .iss-form input:focus, .iss-form select:focus, .iss-form textarea:focus {
          border-color: var(--accent);
        }
      `}</style>
      <div className="iss-form">{children}</div>
    </div>
  )
}

function btnStyle(variant: 'primary' | 'ghost'): React.CSSProperties {
  return {
    padding: '7px 16px', borderRadius: 6, cursor: 'pointer',
    fontSize: 13, fontWeight: 500, border: 'none',
    background: variant === 'primary' ? 'var(--accent)' : 'var(--surface-2)',
    color: variant === 'primary' ? '#fff' : 'var(--text)',
  }
}

type HostForm = {
  label: string
  hostname: string
  port: string
  username: string
  auth_type: 'password' | 'key'
  password: string
  private_key: string
  passphrase: string
  tags: string
}

function HostFormFields({
  form,
  setForm,
  credentialHint,
}: {
  form: HostForm
  setForm: React.Dispatch<React.SetStateAction<HostForm>>
  credentialHint?: string
}) {
  const field = (name: keyof HostForm) => ({
    value: form[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [name]: e.target.value })),
  })

  return (
    <>
      {[
        { label: 'Label',    key: 'label',    placeholder: 'My Server' },
        { label: 'Hostname', key: 'hostname', placeholder: '192.168.1.10' },
        { label: 'Port',     key: 'port',     placeholder: '22' },
        { label: 'Username', key: 'username', placeholder: 'root' },
      ].map(({ label, key, placeholder }) => (
        <FormField key={key} label={label}>
          <input {...field(key as keyof HostForm)} placeholder={placeholder} required />
        </FormField>
      ))}

      <FormField label="Auth type">
        <select {...field('auth_type')}>
          <option value="password">Password</option>
          <option value="key">SSH Key</option>
        </select>
      </FormField>

      {form.auth_type === 'password' ? (
        <FormField label={credentialHint ? `Password — ${credentialHint}` : 'Password'}>
          <input type="password" {...field('password')} />
        </FormField>
      ) : (
        <>
          <FormField label={credentialHint ? `Private key — ${credentialHint}` : 'Private key'}>
            <textarea {...field('private_key')} rows={4} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" />
          </FormField>
          <FormField label="Passphrase (if key is encrypted)">
            <input type="password" {...field('passphrase')} placeholder={credentialHint ? 'Leave empty to keep existing' : 'Leave empty if none'} />
          </FormField>
        </>
      )}

      <FormField label="Tags (comma-separated)">
        <input {...field('tags')} placeholder="production, linux" />
      </FormField>
    </>
  )
}

// ─── Add host modal ───────────────────────────────────────────────────────────

function AddHostModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<HostForm>({
    label: '', hostname: '', port: '22', username: '',
    auth_type: 'password',
    password: '', private_key: '', passphrase: '',
    tags: '',
  })

  const createHost = useMutation({
    mutationFn: (body: object) => apiJson('/api/hosts', 'POST', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hosts'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createHost.mutate({
      label:    form.label,
      hostname: form.hostname,
      port:     Number(form.port),
      username: form.username,
      auth_type: form.auth_type,
      password:    form.auth_type === 'password' ? form.password    : undefined,
      private_key: form.auth_type === 'key'      ? form.private_key : undefined,
      passphrase:  form.auth_type === 'key' && form.passphrase ? form.passphrase : undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    })
  }

  return (
    <HostModal title="Add Host" onClose={onClose} onSubmit={handleSubmit} submitLabel="Add Host">
      <HostFormFields form={form} setForm={setForm} />
    </HostModal>
  )
}

// ─── Edit host modal ──────────────────────────────────────────────────────────

function EditHostModal({ host, onClose }: { host: Host; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<HostForm>({
    label:    host.label,
    hostname: host.hostname,
    port:     String(host.port),
    username: host.username,
    auth_type: host.auth_type,
    password: '', private_key: '', passphrase: '',
    tags: host.tags.join(', '),
  })

  const updateHost = useMutation({
    mutationFn: (body: object) => apiJson(`/api/hosts/${host.id}`, 'PATCH', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hosts'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const body: Record<string, unknown> = {
      label:    form.label,
      hostname: form.hostname,
      port:     Number(form.port),
      username: form.username,
      auth_type: form.auth_type,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }
    if (form.auth_type === 'password' && form.password) {
      body.password = form.password
    } else if (form.auth_type === 'key' && form.private_key) {
      body.private_key = form.private_key
      if (form.passphrase) body.passphrase = form.passphrase
    }
    updateHost.mutate(body)
  }

  return (
    <HostModal title="Edit Host" onClose={onClose} onSubmit={handleSubmit} submitLabel="Save changes">
      <HostFormFields form={form} setForm={setForm} credentialHint="leave blank to keep existing" />
    </HostModal>
  )
}

// ─── Shared modal shell ───────────────────────────────────────────────────────

function HostModal({
  title, onClose, onSubmit, submitLabel, children,
}: {
  title: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: 10, padding: 24, width: 420,
        border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600 }}>{title}</h3>
        <form onSubmit={onSubmit}>
          {children}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" onClick={onClose} style={btnStyle('ghost')}>Cancel</button>
            <button type="submit" style={btnStyle('primary')}>{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
