import { NODE_HEIGHT, NODE_WIDTH, layoutGraph } from './layout'

// 演示模式：
// - generateWorkflowPreset：按输入关键词从预设工作流库中挑选一套返回
// - chatUpdateMock：用规则解析画布修改指令（添加/删除节点、换模型、连线）

const TYPE_KEYWORDS = [
  { type: 'trigger', keywords: ['每天', '每周', '定时', '早上', '监控', '自动', '触发'] },
  { type: 'scrape', keywords: ['抓取', '新闻', '网页', '竞品', '官网', '定价', '价格', '页面', '爬'] },
  { type: 'ai', keywords: ['AI', 'ai', '摘要', '筛选', '分类', '总结', '情感', '分析', 'GPT'] },
  { type: 'condition', keywords: ['条件', '变化', '判断', '提醒'] },
  // 注意：类型名不能用 'output'，与 React Flow 内置节点类型撞名
  { type: 'outputNode', keywords: ['邮箱', '邮件', '发送', '日报', '输出', '通知', '报告', '统计'] },
]

const DEFAULT_NAMES = {
  trigger: '定时触发',
  scrape: '抓取网页内容',
  ai: 'AI 分析处理',
  condition: '条件判断',
  outputNode: '输出结果',
}

const DEFAULT_CONFIG = {
  trigger: { schedule: '每天 09:00' },
  scrape: { url: 'https://example.com' },
  ai: { model: 'gpt-4o-mini', prompt: '总结并提炼关键信息' },
  condition: { expression: '结果有变化时继续' },
  outputNode: { channel: 'email' },
}

/** 预设工作流库：每套包含关键词（用于匹配用户输入）和完整节点链 */
const PRESET_WORKFLOWS = [
  {
    keywords: ['新闻', '摘要', '行业'],
    name: '行业新闻摘要监控',
    description: '每天定时抓取行业新闻，AI 筛选重要内容并生成摘要发送到邮箱',
    nodes: [
      { type: 'trigger', name: '每天 09:00 定时触发', config: { schedule: '每天 09:00' } },
      { type: 'scrape', name: '抓取行业新闻', config: { url: 'https://news.example.com', selector: '.article-list' } },
      { type: 'ai', name: 'AI 筛选并生成摘要', config: { model: 'gpt-4o-mini', prompt: '筛选重要的 5 条新闻并生成中文摘要' } },
      { type: 'outputNode', name: '摘要发送到邮箱', config: { channel: 'email', to: 'me@example.com' } },
    ],
  },
  {
    keywords: ['竞品', '价格', '定价', '官网', '变化'],
    name: '竞品价格变动监控',
    description: '定时监控竞品官网定价页，检测到价格变化时立即提醒',
    nodes: [
      { type: 'trigger', name: '每小时定时触发', config: { schedule: '每小时' } },
      { type: 'scrape', name: '抓取竞品定价页', config: { url: 'https://competitor.example.com/pricing' } },
      { type: 'condition', name: '价格是否有变化', config: { expression: '与上次抓取结果对比' } },
      { type: 'outputNode', name: '变化时发送提醒', config: { channel: 'webhook' } },
    ],
  },
  {
    keywords: ['客户', '反馈', '情感', '分类'],
    name: '客户反馈情感分析',
    description: '自动收集客户反馈，AI 分类主题并统计情感倾向',
    nodes: [
      { type: 'trigger', name: '收到新反馈时触发', config: { event: 'feedback.created' } },
      { type: 'scrape', name: '拉取反馈内容', config: { url: 'https://api.example.com/feedback' } },
      { type: 'ai', name: 'AI 分类与情感分析', config: { model: 'gpt-4o-mini', prompt: '对反馈做主题分类并判断情感倾向（正面/负面/中性）' } },
      { type: 'outputNode', name: '生成统计报表', config: { channel: 'dashboard' } },
    ],
  },
  {
    keywords: ['日报', '进度', '项目', '周报'],
    name: '项目进度周报',
    description: '每周汇总项目进展，AI 生成进度日报并发送到邮箱',
    nodes: [
      { type: 'trigger', name: '每周一 09:00 触发', config: { schedule: '每周一 09:00' } },
      { type: 'ai', name: 'AI 汇总进度', config: { model: 'gpt-4o-mini', prompt: '根据本周任务动态生成进度日报' } },
      { type: 'outputNode', name: '日报发送到邮箱', config: { channel: 'email' } },
    ],
  },
]

/** 兜底预设：输入没有命中任何关键词时，返回完整演示管线 */
const DEFAULT_PRESET = {
  name: '自动化处理管线',
  description: '通用自动化流程：触发 → 抓取 → AI 处理 → 条件判断 → 输出',
  nodes: [
    { type: 'trigger', name: '定时触发', config: { schedule: '每天 09:00' } },
    { type: 'scrape', name: '抓取网页内容', config: { url: 'https://example.com' } },
    { type: 'ai', name: 'AI 分析处理', config: { model: 'gpt-4o-mini', prompt: '总结并提炼关键信息' } },
    { type: 'condition', name: '条件判断', config: { expression: '结果有效时继续' } },
    { type: 'outputNode', name: '输出结果', config: { channel: 'email' } },
  ],
}

function pickPreset(text) {
  let best = null
  let bestScore = 0
  for (const preset of PRESET_WORKFLOWS) {
    const score = preset.keywords.filter((k) => text.includes(k)).length
    if (score > bestScore) {
      best = preset
      bestScore = score
    }
  }
  return best ?? DEFAULT_PRESET
}

function makeNode(type, id, name, config) {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: { name: name ?? DEFAULT_NAMES[type], status: 'idle', config: config ?? { ...DEFAULT_CONFIG[type] } },
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  }
}

function relayout(nodes, edges) {
  const positions = layoutGraph(nodes, edges)
  nodes.forEach((n) => {
    const p = positions.get(n.id)
    if (p) n.position = p
  })
}

export async function generateWorkflowPreset(userInput) {
  // 模拟网络延迟，让"节点依次点亮"的加载动画可见
  await new Promise((resolve) => setTimeout(resolve, 1800))

  const preset = pickPreset(userInput)
  const nodes = preset.nodes.map((n, i) => makeNode(n.type, `${n.type}-${i + 1}`, n.name, n.config))
  const edges = nodes.slice(1).map((node, i) => ({
    id: `e-${nodes[i].id}-${node.id}`,
    source: nodes[i].id,
    target: node.id,
    type: 'flow',
  }))
  relayout(nodes, edges)

  return { name: preset.name, description: preset.description, nodes, edges }
}

function findMentionedNode(message, nodes) {
  for (const { type, keywords } of TYPE_KEYWORDS) {
    if (keywords.some((k) => message.includes(k))) {
      const hit = nodes.find((n) => n.type === type)
      if (hit) return hit
    }
  }
  return nodes.find((n) => message.includes(n.data?.name ?? '')) ?? null
}

export async function chatUpdateMock(userMessage, graph) {
  await new Promise((resolve) => setTimeout(resolve, 900))
  let nodes = structuredClone(graph.nodes)
  let edges = graph.edges.map((e) => ({ ...e }))
  const message = userMessage

  // 修改 AI 模型："把AI节点改成用GPT-4"
  const modelMatch = message.match(/gpt[-\s]?([\w.]+)/i)
  if (modelMatch && /(改|换|用)/.test(message)) {
    const aiNode = nodes.find((n) => n.type === 'ai')
    if (!aiNode) {
      return { nodes, edges, reply: '当前工作流没有 AI 处理节点，可以让我先"添加一个AI节点"' }
    }
    const model = `gpt-${modelMatch[1]}`
    aiNode.data.config = { ...aiNode.data.config, model }
    return { nodes, edges, reply: `已把 AI 节点的模型切换为 ${model}` }
  }

  // 删除节点："把抓取节点删掉"
  if (/(删除|移除|去掉|删掉)/.test(message)) {
    const target = findMentionedNode(message, nodes)
    if (target && nodes.length > 1) {
      nodes = nodes.filter((n) => n.id !== target.id)
      edges = edges.filter((e) => e.source !== target.id && e.target !== target.id)
      relayout(nodes, edges)
      return {
        nodes,
        edges,
        reply: `已删除「${target.data?.name ?? target.id}」节点及相关连线`,
      }
    }
    return { nodes, edges, reply: '至少需要保留一个节点，无法删除' }
  }

  // 添加节点："再加一个条件判断"
  if (/(添加|增加|新增|加一|加个|再加|加上)/.test(message)) {
    let targetType = null
    for (const { type, keywords } of TYPE_KEYWORDS) {
      if (keywords.some((k) => message.includes(k))) {
        targetType = type
        break
      }
    }
    if (!targetType) targetType = 'condition'
    const id = `${targetType}-${Date.now().toString(36)}`
    // 接到链尾（没有出边的节点）之后
    const tail =
      nodes.find((n) => !edges.some((e) => e.source === n.id)) ??
      nodes[nodes.length - 1] ??
      null
    const node = makeNode(targetType, id)
    nodes.push(node)
    if (tail) edges.push({ id: `e-${tail.id}-${id}`, source: tail.id, target: id, type: 'flow' })
    relayout(nodes, edges)
    return {
      nodes,
      edges,
      reply: `已添加「${DEFAULT_NAMES[targetType]}」节点${tail ? `，并连接到「${tail.data?.name ?? tail.id}」之后` : ''}`,
    }
  }

  // 连接两个节点："把触发连到条件判断"
  if (/(连接|连到|接到|连线)/.test(message)) {
    const mentioned = TYPE_KEYWORDS.filter(({ keywords }) =>
      keywords.some((k) => message.includes(k)),
    ).map(({ type }) => type)
    const a = nodes.find((n) => n.type === mentioned[0])
    const b = nodes.find((n) => n.type === mentioned[1])
    if (a && b && a.id !== b.id) {
      if (!edges.some((e) => e.source === a.id && e.target === b.id)) {
        edges.push({ id: `e-${a.id}-${b.id}`, source: a.id, target: b.id, type: 'flow' })
      }
      return { nodes, edges, reply: `已把「${a.data?.name}」连接到「${b.data?.name}」` }
    }
    return { nodes, edges, reply: '没有在画布上找到要连接的两个节点' }
  }

  return {
    nodes,
    edges,
    reply: '收到！演示模式使用规则解析，支持「添加/删除节点」「把AI节点改成用GPT-4」「连接节点」等指令。',
  }
}
