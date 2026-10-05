import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Loader2, Search, Users } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import { NODE_TYPE_MAP } from '../components/nodes'
import { TEMPLATE_CATEGORIES, applyTemplate, listTemplates } from '../lib/templates'
import { cn } from '../lib/utils'

const CATEGORY_COLORS = {
  营销: 'border-pink-400/40 bg-pink-400/10 text-pink-300',
  运营: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
  数据分析: 'border-violet-400/40 bg-violet-400/10 text-violet-300',
  内容创作: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  客服: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
}

const FILTERS = ['全部', ...TEMPLATE_CATEGORIES]

function TemplateCard({ template, busy, index = 0, onUse }) {
  const categoryCls = CATEGORY_COLORS[template.category] ?? CATEGORY_COLORS['运营']

  return (
    <motion.button
      type="button"
      onClick={() => onUse(template)}
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: 'easeOut' }}
      className="card group relative flex w-full flex-col p-5 text-left transition-shadow hover:shadow-[0_0_28px_rgba(0,212,255,0.18)]"
    >
      {/* 分类标签 + 使用次数 */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-xs font-medium',
            categoryCls,
          )}
        >
          {template.category}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted">
          <Users className="h-3.5 w-3.5" />
          {template.usageCount} 次使用
        </span>
      </div>

      <h3 className="mt-3 text-base font-bold text-foreground">{template.name}</h3>
      <p className="mt-1.5 line-clamp-2 min-h-10 text-sm text-muted">{template.description}</p>

      {/* 节点类型图标序列：hover 时微浮动 */}
      <div className="mt-4 flex items-center gap-1">
        {template.nodes.map((node, i) => {
          const cfg = NODE_TYPE_MAP[node.type]
          if (!cfg) return null
          const Icon = cfg.icon
          return (
            <span key={node.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted/60" />}
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md group-hover:animate-[icon-float_1.8s_ease-in-out_infinite]"
                style={{
                  background: `${cfg.color}1A`,
                  color: cfg.color,
                  animationDelay: `${i * 120}ms`,
                }}
                title={node.data?.name}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
            </span>
          )
        })}
      </div>

      {/* hover 时显示"使用此模板" */}
      <div className="mt-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-cyan-600 py-2 text-xs font-semibold text-background shadow-lg shadow-primary/20">
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {busy ? '正在创建…' : '使用此模板'}
        </span>
      </div>
    </motion.button>
  )
}

export default function Templates() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [category, setCategory] = useState('全部')
  const [keyword, setKeyword] = useState('')
  const [usingId, setUsingId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listTemplates()
      .then(setTemplates)
      .catch((e) => console.error('[FlowCraft] 加载模板失败', e))
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => {
    const keywordTrimmed = keyword.trim()
    return templates.filter(
      (t) =>
        (category === '全部' || t.category === category) &&
        (!keywordTrimmed ||
          t.name.includes(keywordTrimmed) ||
          (t.description ?? '').includes(keywordTrimmed)),
    )
  }, [templates, category, keyword])

  const handleUse = async (template) => {
    if (usingId) return
    setUsingId(template.id)
    try {
      const record = await applyTemplate(template.id)
      navigate(`/workflow/${record.id}`)
    } catch (e) {
      console.error('[FlowCraft] 使用模板失败', e)
    } finally {
      setUsingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* 标题 + 搜索框 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">模板市场</h1>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索模板名称或描述…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-foreground outline-none backdrop-blur-xl placeholder:text-muted/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((key) => {
          const count =
            key === '全部'
              ? templates.length
              : templates.filter((t) => t.category === key).length
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                category === key
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-white/10 bg-white/5 text-muted hover:text-foreground',
              )}
            >
              {key}
              <span className="ml-1 opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      {/* 模板网格 */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title="没有匹配的模板"
          description="换个关键词，或清除筛选条件再试试。"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((template, i) => (
            <TemplateCard
              key={template.id}
              template={template}
              index={i}
              busy={usingId === template.id}
              onUse={handleUse}
            />
          ))}
        </div>
      )}
    </div>
  )
}
