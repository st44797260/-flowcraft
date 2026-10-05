import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Dashboard from '../components/Dashboard'
import EmptyState from '../components/EmptyState'
import FadeIn from '../components/FadeIn'
import GenerationOverlay from '../components/GenerationOverlay'
import Skeleton from '../components/Skeleton'
import TypingCarousel from '../components/TypingCarousel'
import WorkflowCard from '../components/WorkflowCard'
import { generateWorkflow } from '../lib/ai'
import { createWorkflow, dataMode, listWorkflows } from '../lib/workflows'

const HERO_PHRASES = [
  '用自然语言编排AI工作流',
  '让重复工作自动消失',
  '72小时上线你的第一个自动化',
]

const EXAMPLES = [
  '每天抓取行业新闻，AI筛选后生成摘要发我邮箱',
  '监控竞品官网，价格变化时提醒我',
  '把客户反馈自动分类并统计情感倾向',
  '每周生成一份我的项目进度日报',
]

export default function Home() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
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
      {/* Hero：AI 创建工作流输入区 */}
      <section className="card relative overflow-hidden p-6 sm:p-10">
        {/* 动态渐变光晕：青色与紫色缓慢移动 */}
        <div className="hero-blob-a pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="hero-blob-b pointer-events-none absolute -right-20 -bottom-32 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />

        <div className="relative">
          <h1 className="min-h-12 bg-gradient-to-r from-primary via-cyan-300 to-secondary bg-clip-text text-3xl font-bold text-transparent sm:min-h-14 sm:text-4xl">
            <TypingCarousel phrases={HERO_PHRASES} />
          </h1>
          <p className="mt-3 text-sm text-muted">
            FlowCraft —— 连接抓取、AI 处理与消息触达的轻量自动化平台，从一句话到可运行的工作流。
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate()
              }}
              placeholder="用一句话描述你想自动化的事情，比如：每周一早上抓取竞品定价页面，有变化就总结发我邮箱"
              className="w-full flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground outline-none backdrop-blur-xl transition placeholder:text-muted/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
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
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted transition hover:border-primary/40 hover:text-primary active:scale-95"
              >
                {text}
              </button>
            ))}
          </div>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </div>
      </section>

      {/* 数据看板 */}
      <FadeIn>
        <Dashboard />
      </FadeIn>

      {/* 工作流列表 */}
      <section>
        <FadeIn>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">工作流列表</h2>
            <span className="text-xs text-muted">
              {dataMode === 'supabase' ? '已连接 Supabase' : '演示模式：数据保存在浏览器本地'}
            </span>
          </div>
        </FadeIn>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : listError ? (
          <p className="text-sm text-danger">读取失败：{listError}</p>
        ) : workflows.length === 0 ? (
          <EmptyState
            title="还没有工作流"
            description="用上方 AI 输入框描述你的需求，自动生成第一个工作流；或者到模板市场挑一个现成的。"
            actionLabel="创建第一个工作流"
            onAction={() => {
              inputRef.current?.focus()
              inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((wf, i) => (
              <WorkflowCard key={wf.id} workflow={wf} index={i} />
            ))}
          </div>
        )}
      </section>

      {generating && <GenerationOverlay />}
    </div>
  )
}
