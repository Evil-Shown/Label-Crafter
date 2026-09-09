/** Shared UI primitives for consistent polish across panels. */

export function PanelHeader({ title, badge, action }) {
  return (
    <div className="lc-panel-header">
      <span className="lc-panel-title">{title}</span>
      <div className="flex items-center gap-2">
        {badge}
        {action}
      </div>
    </div>
  )
}

export function SectionLabel({ children }) {
  return <div className="lc-section-label">{children}</div>
}

export function PropGroup({ title, children }) {
  return (
    <div className="lc-prop-group space-y-2.5">
      {title && (
        <div className="text-xs font-semibold text-[var(--lc-text)]">{title}</div>
      )}
      {children}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="lc-empty-state flex-1">
      <div className="lc-empty-icon">
        <Icon size={20} />
      </div>
      <p className="text-sm font-semibold text-[var(--lc-text)]">{title}</p>
      {subtitle && (
        <p className="max-w-[200px] text-xs leading-relaxed text-[var(--lc-text-muted)]">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function IconButton({ icon: Icon, title, onClick, active, className = '' }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`lc-icon-btn ${active ? 'active' : ''} ${className}`}
    >
      <Icon size={15} strokeWidth={2} />
    </button>
  )
}
