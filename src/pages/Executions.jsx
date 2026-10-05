import { useEffect, useState } from 'react'
import { Eye, Loader2, RotateCcw } from 'lucide-react'
import { LogEntryBubble } from '../components/ExecutionLogs'
import { runWorkflow } from '../lib/executor'
import { getWorkflow, listWorkflows } from '../lib/workflows'
import { listExecutions, subscribeExecutions } from '../lib/executions'
import { cn, formatDateTime, formatDuration } from '../lib/utils'

const STATUS_CHIPS = {
  success: { label: '成功', cls: 'border-success/40 bg-success/10 text-success' },
  error: { label: '失败', cls: 'border-danger/40 bg-danger/10 text-danger' },
  running: { label: '运行中', cls: 'border-primary/40 bg-primary/10 text-primary' },
}

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'success', label: '成功' },
  { key: 'error', label: '失败' },
  { key: 'running', label: '运行中' },
]

function durationOf(execution) {
  if (!execution.finished_at) return null
  return new Date(execution.finished_at) - new Date(execution.started_at)
}

export default function Executions() {
  const [executions, setExecutions] = useState([])
  const [workflowNames, setWorkflowNames] = useState({})
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null) // 查看详情的执行记录
  const [rerunning, setRerunning] = useState({}) // executionId → true（重跑中）

  useEffect(() => {
    Promise.all([listExecutions(), listWorkflows()])
      .then(([execs, wfs]) => {
        setExecutions(execs)
        setWorkflowNames(Object.fromEntries(wfs.map((w) => [w.id, w.name])))
      })
      .catch((e) => console.error('[FlowCraft] 加载执行历史失败', e))
      .finally(() => setLoading(false))
  }, [])

  // 实时订阅：任意执行记录变化时同步表格行与详情弹窗
  useEffect(() => {
    const unsubscribe = subscribeExecutions((record) => {
      if (!record?.id) return
      setExecutions((list) => {
        const index = list.findIndex((e) => e.id === record.id)
        if (index === -1) return [record, ...list]
        const next = [...list]
        next[index] = record
        return next
      })
      setDetail((current) => (current?.id === record.id ? record : current))
      setRerunning((state) => ({ ...state, [record.id]: record.status === 'running' }))
    })
    return unsubscribe
  }, [])

  const visible = executions.filter((e) => filter === 'all' || e.status === filter)

  // 从执行历史页直接重新运行：取工作流最新图，重跑（不注入故障，必成功）
  const handleRerun = async (execution) => {
    if (rerunning[execution.id]) return
    setRerunning((state) => ({ ...state, [execution.id]: true }))
    try {
      const wf = await getWorkflow(execution.workflow_id)
      if (!wf) throw new Error('工作流已被删除，无法重新运行')
      await runWorkflow({ workflowId: wf.id, nodes: wf.nodes, edges: wf.edges, injectFault: false })
    } catch (e) {
      console.error('[FlowCraft] 重新运行失败', e)
    } finally {
      setRerunning((state) => ({ ...state, [execution.id]: false }))
    }
  }

  // 详情弹窗支持 Esc 关闭
  useEffect(() => {
    if (!detail) return
    const onKey = (e) => {
      if (e.key === 'Escape') setDetail(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detail])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">执行历史</h1>
        {/* 状态筛选 */}
        <div className="flex items-center gap-1.5">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                filter === key
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-white/10 bg-white/5 text-muted hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-muted">加载中…</p>
        ) : visible.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">
            暂无执行记录，到编辑器里点"运行"试试
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">工作流</th>
                <th className="px-5 py-3 font-medium">开始时间</th>
                <th className="px-5 py-3 font-medium">耗时</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((execution) => {
                const chip = STATUS_CHIPS[execution.status] ?? STATUS_CHIPS.running
                const isRerunning = execution.status === 'running' || rerunning[execution.id]
                return (
                  <tr
                    key={execution.id}
                    className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="max-w-52 truncate px-5 py-3.5 font-medium text-foreground">
                      {workflowNames[execution.workflow_id] ?? '（已删除的工作流）'}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {formatDateTime(execution.started_at)}
                    </td>
                    <td className="px-5 py-3.5 text-muted">{formatDuration(durationOf(execution))}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                          chip.cls,
                        )}
                      >
                        {execution.status === 'running' && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        {chip.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetail(execution)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-foreground transition hover:bg-white/10"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          查看详情
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRerun(execution)}
                          disabled={isRerunning}
                          title="重新运行"
                          className="inline-flex items-center gap-1 rounded-lg border border-success/40 bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success transition hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isRerunning ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          {isRerunning ? '运行中' : '重新运行'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 详情弹窗 */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={() => setDetail(null)}
        >
          <div
            className="card flex max-h-[80vh] w-[560px] max-w-full flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div>
                <p className="text-sm font-bold text-foreground">
                  {workflowNames[detail.workflow_id] ?? '（已删除的工作流）'}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatDateTime(detail.started_at)} 开始 · 耗时 {formatDuration(durationOf(detail))}
                </p>
              </div>
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  (STATUS_CHIPS[detail.status] ?? STATUS_CHIPS.running).cls,
                )}
              >
                {(STATUS_CHIPS[detail.status] ?? STATUS_CHIPS.running).label}
              </span>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
              {(detail.logs ?? []).length === 0 ? (
                <p className="py-8 text-center text-xs text-muted">该记录没有日志</p>
              ) : (
                detail.logs.map((entry) => <LogEntryBubble key={entry.id} entry={entry} />)
              )}
            </div>
            {detail.error && (
              <p className="border-t border-white/10 px-5 py-3 text-xs text-danger">{detail.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
