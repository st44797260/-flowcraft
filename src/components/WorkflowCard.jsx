import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cn, formatRelativeTime } from '../lib/utils'

const STATUS_STYLES = {
  draft: { label: '草稿', cls: 'border-warning/40 bg-warning/10 text-warning' },
  active: { label: '启用', cls: 'border-success/40 bg-success/10 text-success' },
  archived: { label: '归档', cls: 'border-white/15 bg-white/5 text-muted' },
}

export default function WorkflowCard({ workflow }) {
  const navigate = useNavigate()
  const status = STATUS_STYLES[workflow.status] ?? STATUS_STYLES.draft

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/workflow/${workflow.id}`)}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="card w-full p-5 text-left transition-shadow hover:shadow-[0_0_28px_rgba(0,212,255,0.18)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="truncate text-base font-bold text-foreground">{workflow.name}</h3>
        <span
          className={cn(
            'shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium',
            status.cls,
          )}
        >
          {status.label}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted">
        {workflow.description || '暂无描述'}
      </p>
      <div className="mt-4 flex items-center gap-3 text-xs text-muted">
        <span className="rounded-md bg-white/5 px-2 py-1">{workflow.nodes?.length ?? 0} 个节点</span>
        <span>编辑于 {formatRelativeTime(workflow.updated_at)}</span>
      </div>
    </motion.button>
  )
}
