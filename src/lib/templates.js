import TEMPLATES, { TEMPLATE_CATEGORIES } from '../data/templates'
import { isSupabaseConfigured, supabase } from './supabase'
import { createWorkflow } from './workflows'
import { NODE_HEIGHT, NODE_WIDTH, layoutGraph } from './layout'

// 模板市场数据层：模板目录硬编码在前端（src/data/templates.js），
// 配置了 Supabase 时优先读 templates 表；使用次数的增量在演示模式
// 下保存在 localStorage，配置 Supabase 后改为更新 usage_count 字段。

export { TEMPLATE_CATEGORIES }

const USAGE_KEY = 'flowcraft.templateUsage'

function usageExtras() {
  try {
    return JSON.parse(localStorage.getItem(USAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

/** 把 chain（type/name/config 数组）构建为画布可用的 nodes/edges */
function buildGraph(chain) {
  const nodes = chain.map((n, i) => ({
    id: `${n.type}-${i + 1}`,
    type: n.type,
    position: { x: 0, y: 0 },
    data: { name: n.name, status: 'idle', config: { ...(n.config ?? {}) } },
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  }))
  const edges = nodes.slice(1).map((node, i) => ({
    id: `e-${nodes[i].id}-${node.id}`,
    source: nodes[i].id,
    target: node.id,
    type: 'flow',
  }))
  const positions = layoutGraph(nodes, edges)
  nodes.forEach((n) => {
    const p = positions.get(n.id)
    if (p) n.position = p
  })
  return { nodes, edges }
}

const DEMO_TEMPLATES = TEMPLATES.map((t) => ({ ...t, ...buildGraph(t.chain) }))

export async function listTemplates() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('usage_count', { ascending: false })
    if (!error && data && data.length > 0) {
      return data.map((t) => ({
        ...t,
        usageCount: t.usage_count,
        chain: [],
      }))
    }
    // 表为空或读取失败时回退到内置目录
  }
  const extras = usageExtras()
  return DEMO_TEMPLATES.map((t) => ({ ...t, usageCount: t.usageCount + (extras[t.id] ?? 0) }))
}

export async function incrementTemplateUsage(templateId) {
  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from('templates')
      .select('usage_count')
      .eq('id', templateId)
      .maybeSingle()
    if (data) {
      const { error } = await supabase
        .from('templates')
        .update({ usage_count: (data.usage_count ?? 0) + 1 })
        .eq('id', templateId)
      if (!error) return
    }
  }
  const extras = usageExtras()
  extras[templateId] = (extras[templateId] ?? 0) + 1
  localStorage.setItem(USAGE_KEY, JSON.stringify(extras))
}

/** 使用模板：usage_count +1，并把模板复制为一个新工作流记录 */
export async function applyTemplate(templateId) {
  const templates = await listTemplates()
  const template = templates.find((t) => t.id === templateId)
  if (!template) throw new Error('模板不存在')
  await incrementTemplateUsage(templateId)
  return createWorkflow({
    name: `${template.name} - 副本`,
    description: template.description,
    nodes: template.nodes,
    edges: template.edges,
    status: 'draft',
  })
}
