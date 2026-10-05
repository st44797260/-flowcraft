import { useState } from 'react'
import { CheckCircle2, ChevronDown, Loader2, RotateCcw, XCircle } from 'lucide-react'
import { cn, formatDuration } from '../lib/utils'

function StatusIcon({ status }) {
  if (status === 'running') {
    return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
  }
  if (status === 'error') {
    return <XCircle className="h-4 w-4 shrink-0 text-danger" />
  }
  return <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
}

/** 单条执行日志气泡：节点名称 + 时间 + 截断输出 + 状态图标，点击展开完整输出 */
export function LogEntryBubble({ entry }) {
  const [expanded, setExpanded] = useState(false)
  const time = entry.startTime
    ? new Date(entry.startTime).toLocaleTimeString('zh-CN', { hour12: false })
    : ''
  const text = entry.error ?? entry.output ?? ''
  const isLong = text.length > 72 || text.includes('\n')

  return (
    <button
      type="button"
      onClick={() => isLong && setExpanded((e) => !e)}
      className={cn(
        'w-full rounded-xl border px-3.5 py-2.5 text-left transition',
        entry.status === 'running' && 'border-primary/40 bg-primary/10',
        entry.status === 'error' && 'border-danger/40 bg-danger/10',
        entry.status === 'success' && 'border-white/10 bg-white/5 hover:border-white/20',
      )}
    >
      <div className="flex items-center gap-2">
        <StatusIcon status={entry.status} />
        <span className="text-xs font-semibold text-foreground">{entry.nodeName}</span>
        <span className="text-[10px] text-muted">
          {time}
          {entry.durationMs != null && ` · ${formatDuration(entry.durationMs)}`}
        </span>
        {isLong && (
          <ChevronDown
            className={cn(
              'ml-auto h-3.5 w-3.5 shrink-0 text-muted transition-transform',
              expanded && 'rotate-180',
            )}
          />
        )}
      </div>
      {text &&
        (expanded ? (
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-black/30 p-2 text-[11px] leading-relaxed text-muted">
            {text}
          </pre>
        ) : (
          <p className="mt-1 truncate text-[11px] text-muted">{text.split('\n')[0]}</p>
        ))}
    </button>
  )
}

/**
 * 画布底部可展开的执行日志面板
 * @param {boolean} open      是否展开
 * @param {Array}  entries    日志数组
 * @param {boolean} running   是否执行中
 * @param {string} lastResult 上一次执行结果：'success' | 'error' | null
 * @param {boolean} simulateError 是否在下次运行注入演示故障
 * @param {(v: boolean) => void} onSimulateErrorToggle
 * @param {() => void} onToggle
 * @param {() => void} onRetry 重试（从失败节点继续）
 */
export default function ExecutionLogPanel({
  open,
  entries,
  running,
  lastResult,
  simulateError,
  onSimulateErrorToggle,
  onToggle,
  onRetry,
}) {
  const doneCount = entries.filter((e) => e.status !== 'running').length

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-background/85 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-4 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="text-xs font-bold text-foreground">执行日志</span>
          <span className="text-[10px] text-muted">
            {doneCount}/{entries.length || 0} 个节点
          </span>
          {running && (
            <span className="flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              运行中
            </span>
          )}
          {!running && lastResult === 'success' && (
            <span className="rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
              执行成功
            </span>
          )}
          {!running && lastResult === 'error' && (
            <span className="rounded-full border border-danger/40 bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
              执行失败
            </span>
          )}
          <ChevronDown
            className={cn('ml-auto h-4 w-4 text-muted transition-transform', open && 'rotate-180')}
          />
        </button>
        {!running && lastResult === 'error' && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-success to-emerald-600 px-3 py-1.5 text-xs font-semibold text-background shadow-lg shadow-success/25 transition hover:brightness-110 active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            从失败节点重试
          </button>
        )}
        {!running && (
          <label
            className="flex cursor-pointer items-center gap-1.5 text-[10px] text-muted transition hover:text-foreground"
            title="勾选后，下次运行会在中间节点注入一个演示故障，用于体验失败状态与重试"
          >
            <input
              type="checkbox"
              checked={simulateError}
              onChange={(e) => onSimulateErrorToggle(e.target.checked)}
              className="h-3 w-3 accent-danger"
            />
            模拟故障
          </label>
        )}
      </div>
      {open && (
        <div className="max-h-56 space-y-2 overflow-y-auto px-4 pb-3">
          {entries.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted">
              点击"运行"后，每个节点的执行过程会实时显示在这里
            </p>
          ) : (
            entries.map((entry) => <LogEntryBubble key={entry.id} entry={entry} />)
          )}
        </div>
      )}
    </div>
  )
}
