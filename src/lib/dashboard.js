import { listExecutions } from './executions'
import { listWorkflows } from './workflows'

// 数据看板聚合层：全部指标从 executions / workflows 计算得出。
// 演示模式下，没有真实执行记录的历史日期会用确定性的模拟值补齐
//（同一天数值稳定），让趋势图在刚起步时也有可读的形状。

const DAY_MS = 24 * 60 * 60 * 1000

function dayKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 确定性伪随机：同样输入永远得到同样输出，保证每次打开看板数值一致 */
function pseudoRandom(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const TYPE_NAMES = {
  trigger: '触发',
  scrape: '抓取',
  ai: 'AI处理',
  condition: '条件判断',
  outputNode: '输出',
  output: '输出',
}
const TYPE_COLORS = {
  触发: '#00D4FF',
  抓取: '#3B82F6',
  AI处理: '#7C3AED',
  条件判断: '#F59E0B',
  输出: '#10B981',
}

export async function getDashboardData() {
  const [executions, workflows] = await Promise.all([listExecutions(), listWorkflows()])

  // 真实执行按天聚合
  const realByDay = new Map()
  for (const e of executions) {
    const key = dayKey(new Date(e.started_at))
    const bucket = realByDay.get(key) ?? { count: 0, success: 0 }
    bucket.count += 1
    if (e.status === 'success') bucket.success += 1
    realByDay.set(key, bucket)
  }

  // 近 30 天序列：有真实数据用真实值，否则（今天除外）补演示值
  const today = new Date()
  const trend = []
  let demoMonthCount = 0
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today.getTime() - i * DAY_MS)
    const label = `${date.getMonth() + 1}/${date.getDate()}`
    const real = realByDay.get(dayKey(date))
    if (real) {
      trend.push({ date: label, count: real.count, success: real.success })
    } else if (i > 0) {
      const count = 2 + Math.floor(pseudoRandom(i * 3.7) * 8) // 2~9 次/天
      const success = Math.min(count, Math.round(count * (0.82 + pseudoRandom(i * 7.3) * 0.16)))
      trend.push({ date: label, count, success })
      if (date.getMonth() === today.getMonth()) demoMonthCount += count
    } else {
      trend.push({ date: label, count: 0, success: 0 })
    }
  }

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthReal = executions.filter((e) => new Date(e.started_at) >= monthStart).length
  const monthCount = monthReal + demoMonthCount

  // 成功率：优先用真实执行计算
  const realTotal = executions.length
  const realSuccess = executions.filter((e) => e.status === 'success').length
  const successRate = realTotal > 0 ? realSuccess / realTotal : 0.92

  // 每次执行预估节省 15 分钟
  const savedMinutes = monthCount * 15

  // 节点类型分布（跨所有工作流统计）
  const typeCounts = {}
  for (const wf of workflows) {
    for (const n of wf.nodes ?? []) {
      const name = TYPE_NAMES[n.type] ?? n.type
      typeCounts[name] = (typeCounts[name] ?? 0) + 1
    }
  }
  const typeDist = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value,
    color: TYPE_COLORS[name] ?? '#6B7280',
  }))

  return {
    totalWorkflows: workflows.length,
    monthCount,
    successRate,
    savedMinutes,
    trend,
    typeDist,
    hasDemoData: demoMonthCount > 0,
  }
}
