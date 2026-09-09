import { useState, useRef } from 'react'
import { COMMON_TOKENS } from '../data/tokens'

export default function TokenInput({ value, onChange, className = '', placeholder, multiline = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const insertToken = (token) => {
    const el = ref.current
    const insert = `{{${token}}}`
    if (el && typeof el.selectionStart === 'number') {
      const start = el.selectionStart
      const end = el.selectionEnd
      const next = value.slice(0, start) + insert + value.slice(end)
      onChange(next)
    } else {
      onChange((value || '') + insert)
    }
    setOpen(false)
  }

  const filtered = COMMON_TOKENS.filter((t) =>
    !value || value.includes('{{') || t.toLowerCase().includes(String(value).toLowerCase()),
  )

  const Input = multiline ? 'textarea' : 'input'

  return (
    <div className="relative">
      <Input
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          if (e.target.value.includes('{{')) setOpen(true)
        }}
        onFocus={() => value?.includes('{{') && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`lc-input w-full ${multiline ? 'min-h-[72px] resize-y font-mono text-xs' : ''} ${className}`}
        placeholder={placeholder}
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-40 overflow-y-auto rounded-lg border border-[var(--lc-panel-border)] bg-[var(--lc-panel)] py-1 shadow-lg">
          {filtered.map((t) => (
            <button
              key={t}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertToken(t)}
              className="block w-full px-3 py-1 text-left font-mono text-xs hover:bg-[var(--lc-accent-soft)]"
            >
              {`{{${t}}}`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
