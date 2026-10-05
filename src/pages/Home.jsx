import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import GenerationOverlay from '../components/GenerationOverlay'
import WorkflowCard from '../components/WorkflowCard'
import { generateWorkflow } from '../lib/ai'
import { createWorkflow, dataMode, listWorkflows } from '../lib/workflows'

const EXAMPLES = [
  '每天抓取行业新闻，AI筛选后生成摘要发我邮箱',
  '监控竞品官网，价格变化时提醒我',
  '把客户反馈自动分类并统计情感倾向',
  '每周生成一份我的项目进度日报',
]

export default function Home() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')

  useEffect(() => {
    listWorkflows()
      .then(setWorkflows)
      .catch((e) => setListError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleGenerate = async () => {
    const prompt = input.trim()
    if (!prompt || generating) return
    setGenerating(true)
    setError('')
    try {
      // 1. 调 AI 生成节点和连线  2. 自动保存到数据库  3. 跳转编辑器
      const result = await generateWorkflow(prompt)
      const record = await createWorkflow({
        name: result.name,
        description: result.description || prompt,
        nodes: result.nodes,
        edges: result.edges,
        status: 'draft',
      })
      navigate(`/workflow/${record.id}`)
    } catch (e) {
      setError(e.message ?? '生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-10">
      {/* AI 创建工作流输入区 */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" />
            AI 创建工作流
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            用一句话描述需求，AI 自动生成节点和连线（演示模式：返回预设工作流）
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate()
              }}
              placeholder="用一句话描述你想自动化的事情，比如：每周一早上抓取竞品定价页面，有变化就总结发我邮箱"
              className="w-full flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground outline-none backdrop-blur-xl placeholder:text-muted/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!input.trim() || generating}
              className="shrink-0 rounded-xl bg-gradient-to-r from-primary to-cyan-600 px-6 py-3 text-sm font-semibold text-background shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              生成工作流
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => setInput(text)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted transition hover:border-primary/40 hover:text-primary"
              >
                {text}
              </button>
            ))}
          </div>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </div>
      </section>

      {/* 工作流列表 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">工作流列表</h2>
          <span className="text-xs text-muted">
            {dataMode === 'supabase' ? '已连接 Supabase' : '演示模式：数据保存在浏览器本地'}
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-muted">加载中…</p>
        ) : listError ? (
          <p className="text-sm text-danger">读取失败：{listError}</p>
        ) : workflows.length === 0 ? (
          <div className="card px-6 py-14 text-center">
            <p className="text-sm text-muted">还没有工作流，用上方 AI 输入框创建第一个吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((wf) => (
              <WorkflowCard key={wf.id} workflow={wf} />
            ))}
          </div>
        )}
      </section>

      {generating && <GenerationOverlay />}
    </div>
  )
}
