import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { NODE_TYPE_MAP } from './nodes'
import { cn, formatRelativeTime } from '../lib/utils'

const STATUS_STYLES = {
  draft: { label: '草稿', cls: 'border-warning/40 bg-warning/10 text-warning' },
  active: { label: '启用', cls: 'border-success/40 bg-success/10 text-success' },
  archived: { label: '归档', cls: 'border-white/15 bg-white/5 text-muted' },
}

const TYPE_ORDER = ['trigger', 'scrape', 'ai', 'condition', 'outputNode']

/** 3D 倾斜：跟随鼠标位置产生 rotateX/rotateY（弹簧回正） */
function useTilt(max = 7) {
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [max, -max]), {
    stiffness: 220,
    damping: 20,
  })
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-max, max]), {
    stiffness: 220,
    damping: 20,
  })

  const onMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5)
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5)
  }
  const onMouseLeave = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  return { rotateX, rotateY, onMouseMove, onMouseLeave }
}

export default function WorkflowCard({ workflow, index = 0 }) {
  const navigate = useNavigate()
  const tilt = useTilt()
  const status = STATUS_STYLES[workflow.status] ?? STATUS_STYLES.draft
  // 工作流包含的节点类型（按流水线顺序去重），用于图标序列
  const iconTypes = TYPE_ORDER.filter((type) =>
    (workflow.nodes ?? []).some((n) => n.type === type),
  )

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/workflow/${workflow.id}`)}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 900 }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: 'easeOut' }}
      className="card group w-full p-5 text-left transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-[0_0_32px_rgba(0,212,255,0.22)]"
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

      {/* 节点类型图标序列：hover 时微浮动 */}
      <div className="mt-3 flex items-center gap-1">
        {iconTypes.map((type, i) => {
          const cfg = NODE_TYPE_MAP[type]
          if (!cfg) return null
          const Icon = cfg.icon
          return (
            <span key={type} className="flex items-center gap-1">
              {i > 0 && <span className="text-muted/50">›</span>}
              <span
                className="flex h-5.5 w-5.5 items-center justify-center rounded-md group-hover:animate-[icon-float_1.8s_ease-in-out_infinite]"
                style={{
                  background: `${cfg.color}1A`,
                  color: cfg.color,
                  animationDelay: `${i * 120}ms`,
                }}
                title={NODE_TYPE_MAP[type]?.title}
              >
                <Icon className="h-3 w-3" />
              </span>
            </span>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted">
        <span className="rounded-md bg-white/5 px-2 py-1">{workflow.nodes?.length ?? 0} 个节点</span>
        <span>编辑于 {formatRelativeTime(workflow.updated_at)}</span>
      </div>
    </motion.button>
  )
}
