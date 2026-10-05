import { useCallback, useRef, useState } from 'react'
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
import dagre from '@dagrejs/dagre'
import {
  Maximize2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Workflow as WorkflowIcon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import FlowEdge from '../components/FlowEdge'
import { NODE_TYPES, NODE_TYPE_LIST, NODE_TYPE_MAP } from '../components/nodes'

// 自动布局时使用的节点估算尺寸（与 BaseNode 的 w-56 保持一致）
const NODE_WIDTH = 224
const NODE_HEIGHT = 112

const edgeTypes = { flow: FlowEdge }

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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { screenToFlowPosition, zoomIn, zoomOut, fitView, setViewport } = useReactFlow()

  const [workflowName, setWorkflowName] = useState('未命名工作流')
  const [editingName, setEditingName] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef(null)

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

  // dagre 自动布局：从左到右整理节点，然后自适应缩放
  const autoLayout = () => {
    const graph = new dagre.graphlib.Graph()
    graph.setDefaultEdgeLabel(() => ({}))
    graph.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 140 })
    nodes.forEach((n) => graph.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
    edges.forEach((e) => graph.setEdge(e.source, e.target))
    dagre.layout(graph)
    setNodes((nds) =>
      nds.map((n) => {
        const pos = graph.node(n.id)
        return pos
          ? { ...n, position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 } }
          : n
      }),
    )
    setTimeout(() => fitView({ duration: 400, padding: 0.15 }), 50)
  }

  // TODO: 后续接入 Supabase 持久化
  const onSave = () => {
    console.log('[FlowCraft] 保存工作流：', { name: workflowName, nodes, edges })
    setSaved(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => setSaved(false), 2000)
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
              : 'border-warning/40 bg-warning/10 text-warning'
          }`}
        >
          {saved ? '已保存' : '草稿'}
        </span>
      </div>

      {/* 画布区域 */}
      <div className="relative min-h-0 flex-1">
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
                  onClick={() => setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })}
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
