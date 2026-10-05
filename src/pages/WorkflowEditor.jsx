import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Loader2,
  Maximize2,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Workflow as WorkflowIcon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import AIPanel from '../components/AIPanel'
import ExecutionLogPanel from '../components/ExecutionLogs'
import FlowEdge from '../components/FlowEdge'
import { NODE_TYPES, NODE_TYPE_LIST, NODE_TYPE_MAP } from '../components/nodes'
import { NODE_HEIGHT, NODE_WIDTH, layoutGraph } from '../lib/layout'
import { updateWorkflowViaChat } from '../lib/ai'
import { runWorkflow } from '../lib/executor'
import { createWorkflow, getWorkflow, updateWorkflow } from '../lib/workflows'
import { cn } from '../lib/utils'

const edgeTypes = { flow: FlowEdge }

// 新建工作流（/workflow/new）时的示例模板：触发 → 抓取 → AI处理 → 输出
const initialNodes = [
  {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 0, y: 140 },
    data: { name: '触发', status: 'idle' },
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  },
  {
    id: 'scrape-1',
    type: 'scrape',
    position: { x: 300, y: 140 },
    data: { name: '抓取', status: 'idle' },
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  },
  {
    id: 'ai-1',
    type: 'ai',
    position: { x: 600, y: 140 },
    data: { name: 'AI处理', status: 'idle' },
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  },
  {
    id: 'output-1',
    type: 'outputNode',
    position: { x: 900, y: 140 },
    data: { name: '输出', status: 'idle' },
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  },
]

const initialEdges = [
  { id: 'e-trigger-1_scrape-1', source: 'trigger-1', target: 'scrape-1', type: 'flow' },
  { id: 'e-scrape-1_ai-1', source: 'scrape-1', target: 'ai-1', type: 'flow' },
  { id: 'e-ai-1_output-1', source: 'ai-1', target: 'output-1', type: 'flow' },
]

const toolbarBtn =
  'inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-white/20 hover:bg-white/10 active:scale-95'
const iconBtn =
  'flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-white/10 hover:text-foreground active:scale-95'

function EditorInner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const { screenToFlowPosition, zoomIn, zoomOut, fitView, setViewport } = useReactFlow()

  const [record, setRecord] = useState(null) // 数据库中的工作流记录
  const [loading, setLoading] = useState(true)
  const [workflowName, setWorkflowName] = useState('未命名工作流')
  const [editingName, setEditingName] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '你好！我是 AI 工作流助手。可以直接告诉我要怎么修改画布，比如"再加一个条件判断"或"把AI节点改成用GPT-4"。',
    },
  ])
  const [chatBusy, setChatBusy] = useState(false)
  const [running, setRunning] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [logEntries, setLogEntries] = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [simulateError, setSimulateError] = useState(false)
  const saveTimer = useRef(null)

  /** 把原始 nodes/edges 规范化为画布可用的形态并整体替换 */
  function applyGraph(rawNodes, rawEdges) {
    setNodes(
      (rawNodes ?? []).map((n) => ({
        ...n,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        data: { status: 'idle', ...(n.data ?? {}) },
      })),
    )
    setEdges((rawEdges ?? []).map((e) => ({ ...e, type: e.type ?? 'flow' })))
    // 图整体替换后重新适配视图
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 60)
  }

  // 按 id 加载工作流；/workflow/new 用示例流程作模板
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    async function load() {
      try {
        if (id === 'new') {
          if (!cancelled) {
            applyGraph(initialNodes, initialEdges)
            setWorkflowName('未命名工作流')
            setRecord(null)
          }
          return
        }
        const data = await getWorkflow(id)
        if (cancelled) return
        if (!data) {
          setWorkflowName('工作流不存在')
          setRecord(null)
          return
        }
        applyGraph(data.nodes ?? [], data.edges ?? [])
        setWorkflowName(data.name ?? '未命名工作流')
        setRecord(data)
      } catch (e) {
        console.error('[FlowCraft] 加载工作流失败', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // 面板开合改变画布宽度后，重新适配视图
  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 200)
    return () => clearTimeout(timer)
  }, [panelOpen, loading, fitView])

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, type: 'flow' }, eds)),
    [setEdges],
  )

  const miniMapNodeColor = useCallback((node) => NODE_TYPE_MAP[node.type]?.color ?? '#6B7280', [])

  const addNode = (cfg) => {
    const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    const offset = (nodes.length % 5) * 28
    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      {
        id: `${cfg.type}-${Math.random().toString(36).slice(2, 8)}`,
        type: cfg.type,
        position: {
          x: center.x - NODE_WIDTH / 2 + offset,
          y: center.y - NODE_HEIGHT / 2 + offset,
        },
        data: { name: cfg.title, status: 'idle' },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        selected: true,
      },
    ])
    setMenuOpen(false)
  }

  const autoLayout = () => {
    const positions = layoutGraph(nodes, edges)
    setNodes((nds) =>
      nds.map((n) => (positions.has(n.id) ? { ...n, position: positions.get(n.id) } : n)),
    )
    setTimeout(() => fitView({ duration: 400, padding: 0.15 }), 50)
  }

  // 保存：/workflow/new 首次保存创建记录，之后更新
  const onSave = async () => {
    setSaveError('')
    try {
      if (id === 'new' || !record) {
        const created = await createWorkflow({
          name: workflowName,
          description: '',
          nodes,
          edges,
          status: 'draft',
        })
        setRecord(created)
        navigate(`/workflow/${created.id}`, { replace: true })
      } else {
        const updated = await updateWorkflow(id, { name: workflowName, nodes, edges })
        setRecord(updated)
      }
      setSaved(true)
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('[FlowCraft] 保存失败', e)
      setSaveError(e.message ?? '保存失败')
    }
  }

  const resetView = () => setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })

  // 执行工作流：未保存先保存；resumeFrom 非空时从失败节点继续（重试不再注入故障）
  const handleRun = async (resumeFrom = null) => {
    if (running) return
    let wf = record
    try {
      if (!wf) {
        wf = await createWorkflow({
          name: workflowName,
          description: '',
          nodes,
          edges,
          status: 'draft',
        })
        setRecord(wf)
        navigate(`/workflow/${wf.id}`, { replace: true })
      }
    } catch (e) {
      console.error('[FlowCraft] 执行前保存失败', e)
      return
    }

    setLogOpen(true)
    setRunning(true)
    setLastResult(null)
    setLogEntries([])

    // 重置画布节点状态：全新执行全部归位，重试只重置失败节点
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, status: resumeFrom ? (n.id === resumeFrom ? 'idle' : n.data.status) : 'idle' },
      })),
    )

    await runWorkflow({
      workflowId: wf.id,
      nodes,
      edges,
      startNodeId: resumeFrom,
      injectFault: !resumeFrom && simulateError,
      onEvent: (event) => {
        if (event.type === 'node-status') {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === event.nodeId ? { ...n, data: { ...n.data, status: event.status } } : n,
            ),
          )
        } else if (event.type === 'logs') {
          setLogEntries(event.logs)
        } else if (event.type === 'done') {
          setLastResult({ status: event.status, failedNodeId: event.failedNodeId })
        }
      },
    })
    setRunning(false)
  }

  // AI 对话：解析指令 → 更新画布 → 自动保存
  const handleChatSend = async (text) => {
    setMessages((m) => [...m, { role: 'user', content: text }])
    setChatBusy(true)
    try {
      const result = await updateWorkflowViaChat(text, { nodes, edges })
      applyGraph(result.nodes, result.edges)
      setMessages((m) => [...m, { role: 'assistant', content: result.reply }])
      if (id !== 'new' && record) {
        await updateWorkflow(id, { nodes: result.nodes, edges: result.edges }).catch((e) =>
          console.error('[FlowCraft] AI 修改后自动保存失败', e),
        )
      }
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `出错了：${e.message}` }])
    } finally {
      setChatBusy(false)
    }
  }

  return (
    <div className="card flex h-[calc(100vh-10rem)] min-h-[560px] flex-col overflow-hidden">
      {/* 画布顶栏：工作流名称（点击编辑） + 状态标签 */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-2.5">
        {editingName ? (
          <input
            autoFocus
            defaultValue={workflowName}
            onBlur={(e) => {
              setWorkflowName(e.currentTarget.value.trim() || '未命名工作流')
              setEditingName(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
            className="w-64 rounded-lg bg-white/10 px-2.5 py-1 text-sm font-semibold text-foreground outline-none ring-1 ring-primary/60"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            title="点击重命名"
            className="group flex items-center gap-1.5 rounded-lg px-2 py-1 text-base font-bold text-foreground hover:bg-white/5"
          >
            {workflowName}
            <Pencil className="h-3 w-3 text-muted transition group-hover:text-foreground" />
          </button>
        )}
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            saved
              ? 'border-success/40 bg-success/10 text-success'
              : saveError
                ? 'border-danger/40 bg-danger/10 text-danger'
                : 'border-warning/40 bg-warning/10 text-warning'
          }`}
        >
          {saved ? '已保存' : saveError ? '保存失败' : '草稿'}
        </span>
      </div>

      {/* 画布 + AI 面板 */}
      <div className="relative flex min-h-0 flex-1">
        <div className={cn('relative min-w-0 flex-1', running && 'execution-active')}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            edgeTypes={edgeTypes}
            colorMode="dark"
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{ type: 'flow' }}
            connectionLineStyle={{ stroke: '#00D4FF', strokeWidth: 2 }}
            onPaneClick={() => setMenuOpen(false)}
            /* 平移：中键/右键拖拽，或按住空格+左键拖拽 */
            panOnDrag={[1, 2]}
            panActivationKeyCode="Space"
            /* 选中元素可用 Backspace 或 Delete 删除 */
            deleteKeyCode={['Backspace', 'Delete']}
          >
            {/* 点状网格：白色 5% 透明度 */}
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={2}
              color="rgba(255,255,255,0.05)"
            />

            {/* 左上角：工具栏 + 缩放控制 */}
            <Panel position="top-left">
              <div className="card flex flex-col gap-2 p-2">
                <div className="relative flex items-center gap-1.5">
                  {/* 运行按钮：绿色渐变，执行中显示旋转动画 */}
                  <button
                    type="button"
                    onClick={() => handleRun()}
                    disabled={running || loading || nodes.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-success to-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-background shadow-lg shadow-success/25 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {running ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    {running ? '运行中...' : '运行'}
                  </button>
                  <button
                    type="button"
                    className={toolbarBtn}
                    onClick={() => setMenuOpen((open) => !open)}
                  >
                    <Plus className="h-3.5 w-3.5 text-primary" />
                    添加节点
                  </button>
                  <button type="button" className={toolbarBtn} onClick={autoLayout}>
                    <WorkflowIcon className="h-3.5 w-3.5 text-secondary" />
                    自动布局
                  </button>
                  <button type="button" className={toolbarBtn} onClick={onSave}>
                    <Save className="h-3.5 w-3.5 text-success" />
                    保存
                  </button>

                  {menuOpen && (
                    <div className="absolute left-0 top-full z-10 mt-2 w-44 rounded-xl border border-white/10 bg-surface-raised/95 p-1.5 shadow-2xl backdrop-blur-xl">
                      {NODE_TYPE_LIST.map((cfg) => {
                        const Icon = cfg.icon
                        return (
                          <button
                            key={cfg.type}
                            type="button"
                            onClick={() => addNode(cfg)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground transition hover:bg-white/10"
                          >
                            <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                            {cfg.title}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 border-t border-white/10 pt-2">
                  <button
                    type="button"
                    className={iconBtn}
                    title="放大"
                    onClick={() => zoomIn({ duration: 200 })}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={iconBtn}
                    title="缩小"
                    onClick={() => zoomOut({ duration: 200 })}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={iconBtn}
                    title="适应画布"
                    onClick={() => fitView({ duration: 300, padding: 0.2 })}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={iconBtn}
                    title="重置视图"
                    onClick={resetView}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Panel>

            {/* 右下角小地图：节点颜色按类型区分 */}
            <MiniMap
              pannable
              zoomable
              position="bottom-right"
              nodeColor={miniMapNodeColor}
              nodeStrokeColor="rgba(255,255,255,0.15)"
              nodeBorderRadius={8}
              maskColor="rgba(10,14,26,0.75)"
              bgColor="#0A0E1A"
              className="!rounded-xl !border !border-white/10"
            />
          </ReactFlow>

          {loading && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <p className="text-sm text-muted">加载工作流中…</p>
            </div>
          )}

          {/* 底部可展开的执行日志面板 */}
          <ExecutionLogPanel
            open={logOpen}
            entries={logEntries}
            running={running}
            lastResult={lastResult?.status ?? null}
            simulateError={simulateError}
            onSimulateErrorToggle={setSimulateError}
            onToggle={() => setLogOpen((open) => !open)}
            onRetry={() => handleRun(lastResult?.failedNodeId ?? null)}
          />

          {/* 折叠状态下显示 AI 助手入口 */}
          {!panelOpen && !loading && (
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-xl border border-secondary/40 bg-secondary/15 px-3 py-2 text-xs font-semibold text-foreground shadow-lg shadow-secondary/20 transition hover:bg-secondary/25"
            >
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              AI 助手
            </button>
          )}
        </div>

        <AIPanel
          open={panelOpen}
          messages={messages}
          busy={chatBusy}
          onSend={handleChatSend}
          onClose={() => setPanelOpen(false)}
        />
      </div>
    </div>
  )
}

export default function WorkflowEditor() {
  return (
    <ReactFlowProvider>
      <EditorInner />
    </ReactFlowProvider>
  )
}
