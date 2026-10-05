import { useRef, useState } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'

const STATUS_STYLES = {
  idle: { dot: 'bg-muted', text: 'text-muted', label: '空闲' },
  running: {
    dot: 'bg-primary animate-pulse shadow-[0_0_6px_rgba(0,212,255,0.9)]',
    text: 'text-primary',
    label: '运行中',
  },
  success: {
    dot: 'bg-success shadow-[0_0_6px_rgba(16,185,129,0.7)]',
    text: 'text-success',
    label: '成功',
  },
  error: {
    dot: 'bg-danger shadow-[0_0_6px_rgba(239,68,68,0.7)]',
    text: 'text-danger',
    label: '错误',
  },
}

const handleStyle = (color, filled) => ({
  width: 11,
  height: 11,
  background: filled ? color : '#0A0E1A',
  border: `2px solid ${color}`,
})

// 所有节点类型的公共外壳：玻璃拟态卡片 + 类型配色 + 可编辑名称 + 状态指示器
export default function BaseNode({ id, data, selected, config }) {
  const { updateNodeData } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const skipCommit = useRef(false)
  const Icon = config.icon
  const status = STATUS_STYLES[data.status] ?? STATUS_STYLES.idle

  const commit = (event) => {
    if (skipCommit.current) {
      skipCommit.current = false
    } else {
      const next = event.currentTarget.value.trim()
      updateNodeData(id, { name: next || config.title })
    }
    setEditing(false)
  }

  return (
    <div
      className="relative w-56 rounded-xl border bg-white/5 px-3.5 py-3 transition-shadow"
      style={{
        borderColor: `${config.color}59`,
        boxShadow: selected
          ? `0 0 0 1px ${config.color}CC, 0 0 24px ${config.color}40`
          : `0 0 18px ${config.color}1F`,
      }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle(config.color, false)} />
      <Handle type="source" position={Position.Right} style={handleStyle(config.color, true)} />

      {/* 顶部：图标 + 类型标签 */}
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${config.color}1A`, color: config.color }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-medium tracking-wide" style={{ color: config.color }}>
          {config.title}
        </span>
      </div>

      {/* 中间：节点名称（点击编辑） */}
      <div className="mt-2.5">
        {editing ? (
          <input
            autoFocus
            defaultValue={data.name}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
              if (event.key === 'Escape') {
                skipCommit.current = true
                setEditing(false)
              }
            }}
            className="nodrag w-full rounded-md bg-white/10 px-2 py-1 text-sm font-semibold text-foreground outline-none ring-1 ring-primary/60"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="点击重命名"
            className="nodrag block w-full truncate rounded-md px-1 py-0.5 text-left text-sm font-semibold text-foreground hover:bg-white/10"
          >
            {data.name}
          </button>
        )}
      </div>

      {/* 底部：状态指示器 idle灰 / running青色脉冲 / success绿 / error红 */}
      <div className={`mt-2 flex items-center gap-1.5 text-xs ${status.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
        {status.label}
      </div>
    </div>
  )
}
