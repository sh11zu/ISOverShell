import { useSettingsStore } from '../stores/settings'
import type { CursorStyle } from '../stores/settings'
import { THEME_META } from '../lib/themes'
import type { TerminalTheme } from '../lib/themes'

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{
        margin: '0 0 16px',
        fontSize: 13,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
      }}>
        {title}
      </h3>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

function Row({
  label,
  description,
  children,
  last,
}: {
  label: string
  description?: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
      padding: '14px 18px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

// ─── Theme swatch ─────────────────────────────────────────────────────────────

function ThemeSwatch({
  label,
  palette,
  active,
  onClick,
}: {
  label: string
  palette: string[]
  active: boolean
  onClick: () => void
}) {
  const [bg, ...colors] = palette
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <div style={{
        width: 56,
        height: 40,
        borderRadius: 6,
        background: bg,
        border: active
          ? '2px solid var(--accent)'
          : '2px solid var(--border)',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '6px 5px',
        gap: 3,
        transition: 'border-color 0.15s',
        boxSizing: 'border-box',
      }}>
        {colors.map((c, i) => (
          <div
            key={i}
            style={{ flex: 1, height: 6, borderRadius: 2, background: c }}
          />
        ))}
      </div>
      <span style={{
        fontSize: 11,
        color: active ? 'var(--text)' : 'var(--text-muted)',
        fontWeight: active ? 600 : 400,
        transition: 'color 0.15s',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </button>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        background: checked ? 'var(--accent)' : 'var(--border)',
        border: 'none',
        cursor: 'pointer',
        padding: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }} />
    </button>
  )
}

// ─── Segment buttons ──────────────────────────────────────────────────────────

function SegmentGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{
      display: 'flex',
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '5px 14px',
            fontSize: 13,
            border: 'none',
            cursor: 'pointer',
            background: value === opt.value ? 'var(--accent)' : 'transparent',
            color: value === opt.value ? '#fff' : 'var(--text-muted)',
            fontWeight: value === opt.value ? 600 : 400,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Shortcut row ─────────────────────────────────────────────────────────────

function ShortcutRow({ keys, action, last }: { keys: string[]; action: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 18px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{action}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {keys.map((k, i) => (
          <kbd
            key={i}
            style={{
              display: 'inline-block',
              padding: '2px 7px',
              fontSize: 11,
              fontFamily: 'monospace',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              color: 'var(--text)',
              lineHeight: 1.6,
            }}
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Settings() {
  const {
    terminalTheme, fontSize, cursorStyle, cursorBlink,
    setTerminalTheme, setFontSize, setCursorStyle, setCursorBlink,
  } = useSettingsStore()

  return (
    <div style={{ padding: '24px 28px', maxWidth: 660, minHeight: '100%' }}>
      <h2 style={{ margin: '0 0 28px', fontWeight: 600, fontSize: 18, color: 'var(--text)' }}>
        Settings
      </h2>

      {/* ── Terminal Appearance ── */}
      <Section title="Terminal Appearance">
        {/* Theme */}
        <Row label="Theme" description="Color scheme applied to all terminal sessions">
          <div style={{ display: 'flex', gap: 12 }}>
            {(Object.keys(THEME_META) as TerminalTheme[]).map(id => (
              <ThemeSwatch
                key={id}
                label={THEME_META[id].label}
                palette={THEME_META[id].palette}
                active={terminalTheme === id}
                onClick={() => setTerminalTheme(id)}
              />
            ))}
          </div>
        </Row>

        {/* Font size */}
        <Row label="Font size" description="Terminal font size in pixels">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="range"
              min={10}
              max={24}
              step={1}
              value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              style={{ width: 100, accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span style={{
              fontSize: 13,
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
              minWidth: 32,
              textAlign: 'right',
            }}>
              {fontSize}px
            </span>
          </div>
        </Row>

        {/* Cursor style */}
        <Row label="Cursor style">
          <SegmentGroup<CursorStyle>
            options={[
              { value: 'block',     label: 'Block' },
              { value: 'bar',       label: 'Bar' },
              { value: 'underline', label: 'Underline' },
            ]}
            value={cursorStyle}
            onChange={setCursorStyle}
          />
        </Row>

        {/* Cursor blink */}
        <Row label="Cursor blink" last>
          <Toggle checked={cursorBlink} onChange={setCursorBlink} />
        </Row>
      </Section>

      {/* ── Keyboard Shortcuts ── */}
      <Section title="Keyboard Shortcuts">
        <div style={{ padding: '8px 0' }}>
          <div style={{
            padding: '6px 18px 10px',
            fontSize: 11,
            color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border)',
          }}>
            App shortcuts
          </div>
          <ShortcutRow keys={['Right-click']} action="Paste from clipboard" />
          <div style={{
            padding: '10px 18px 6px',
            fontSize: 11,
            color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border)',
          }}>
            Shell shortcuts (sent to the remote session)
          </div>
          <ShortcutRow keys={['Ctrl', 'C']} action="Interrupt / cancel" />
          <ShortcutRow keys={['Ctrl', 'D']} action="Logout / EOF" />
          <ShortcutRow keys={['Ctrl', 'L']} action="Clear screen" />
          <ShortcutRow keys={['Ctrl', 'Z']} action="Suspend process" />
          <ShortcutRow keys={['Ctrl', 'A']} action="Go to beginning of line" />
          <ShortcutRow keys={['Ctrl', 'E']} action="Go to end of line" />
          <ShortcutRow keys={['Ctrl', 'R']} action="Search command history" last />
        </div>
      </Section>
    </div>
  )
}
