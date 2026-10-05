/** 空状态：品牌配色的节点连接插画 + 引导文案 + 操作按钮 */
export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <svg width="150" height="90" viewBox="0 0 150 90" fill="none" className="mb-4" aria-hidden="true">
        <line x1="30" y1="45" x2="75" y2="20" stroke="rgba(0,212,255,0.4)" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="30" y1="45" x2="75" y2="70" stroke="rgba(124,58,237,0.4)" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="75" y1="20" x2="120" y2="45" stroke="rgba(16,185,129,0.4)" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="75" y1="70" x2="120" y2="45" stroke="rgba(245,158,11,0.4)" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="30" cy="45" r="10" fill="#00D4FF" fillOpacity="0.15" stroke="#00D4FF" />
        <circle cx="75" cy="20" r="10" fill="#7C3AED" fillOpacity="0.15" stroke="#7C3AED" />
        <circle cx="75" cy="70" r="10" fill="#F59E0B" fillOpacity="0.15" stroke="#F59E0B" />
        <circle cx="120" cy="45" r="10" fill="#10B981" fillOpacity="0.15" stroke="#10B981" />
      </svg>
      <p className="text-base font-bold text-foreground">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-xl bg-gradient-to-r from-primary to-cyan-600 px-5 py-2.5 text-sm font-semibold text-background shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
