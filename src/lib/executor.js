import { createExecution, updateExecution } from './executions'

// 工作流执行引擎（演示版）：在客户端按节点顺序模拟执行，
// 每种节点类型有独立的执行逻辑与模拟输出；每个节点的状态变化
// 与日志都会通过 onEvent 实时回调，并持久化到 executions 数据层。
// 未来接入 Supabase Edge Function 时，可将本文件逻辑迁移为服务端实现。

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function conditionPassed(node) {
  const expr = node.data?.config?.expression ?? ''
  return !/(不|无效|失败)/.test(expr)
}

function executeNode(node, prevOutput) {
  const config = node.data?.config ?? {}
  switch (node.type) {
    case 'trigger':
      return {
        output: `工作流已触发（${config.schedule ?? config.event ?? '手动触发'}）`,
      }
    case 'scrape':
      return {
        output: `已抓取 ${config.url ?? 'https://example.com'}，获取内容 4,213 字符。\n样例：商品A ¥299（有货）；商品B ¥349（库存紧张）；商品C ¥279（有货）…`,
      }
    case 'ai':
      return {
        output: `模型 ${config.model ?? 'gpt-4o-mini'} 处理完成：上游输入 ${prevOutput.length} 字符，提炼出 3 个要点，情感倾向中性偏正面。`,
      }
    case 'condition': {
      const passed = conditionPassed(node)
      return {
        output: passed
          ? '条件成立：结果与预期一致，继续执行主分支'
          : '条件不成立：本次跳过主分支',
        passed,
      }
    }
    case 'outputNode':
      return {
        output: `已通过 ${config.channel ?? 'email'} 送达（收件人 ${config.to ?? '默认联系人'}）：${(prevOutput || '无上游输出').slice(0, 50)}…`,
      }
    default:
      return { output: '节点执行完成' }
  }
}

/**
 * 执行一个工作流：
 * @param {object} options
 * @param {string} options.workflowId          工作流 id（写入 executions.workflow_id）
 * @param {Array}  options.nodes               画布节点
 * @param {Array}  options.edges               画布连线
 * @param {string} [options.startNodeId]       起始节点（重试时传失败节点，从断点继续）
 * @param {boolean} [options.injectFault]      是否注入随机演示故障（重试时传 false）
 * @param {(event: object) => void} [options.onEvent]
 *   事件：{ type:'node-status', nodeId, status } | { type:'logs', logs } | { type:'done', status, failedNodeId }
 */
export async function runWorkflow({
  workflowId,
  nodes,
  edges,
  startNodeId = null,
  injectFault = true,
  onEvent = () => {},
}) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]))

  // 故障注入：injectFault=true 时必在一个 scrape/ai/output 节点上注入失败
  //（节点随机选择），用于演示错误状态与重试
  const faultCandidates = nodes.filter((n) => ['scrape', 'ai', 'outputNode'].includes(n.type))
  const faultNodeId =
    injectFault && faultCandidates.length > 0
      ? faultCandidates[Math.floor(Math.random() * faultCandidates.length)].id
      : null

  const startedAt = new Date().toISOString()
  const execution = await createExecution({
    workflow_id: workflowId,
    status: 'running',
    started_at: startedAt,
    logs: [],
  })

  const logs = []
  const persist = async () => {
    await updateExecution(execution.id, { logs: JSON.parse(JSON.stringify(logs)) })
    onEvent({ type: 'logs', logs: JSON.parse(JSON.stringify(logs)) })
  }

  let currentId =
    startNodeId ??
    nodes.find((n) => n.type === 'trigger')?.id ??
    nodes[0]?.id ??
    null
  let prevOutput = ''
  let finalStatus = 'success'
  let finalError = null
  let failedNodeId = null
  const executed = new Set()

  onEvent({ type: 'start' })

  while (currentId && !executed.has(currentId)) {
    executed.add(currentId)
    const node = nodeById.get(currentId)
    if (!node) break

    const entry = {
      id: crypto.randomUUID(),
      nodeId: node.id,
      nodeType: node.type,
      nodeName: node.data?.name ?? node.id,
      status: 'running',
      startTime: new Date().toISOString(),
    }
    logs.push(entry)
    await persist()
    onEvent({ type: 'node-status', nodeId: node.id, status: 'running' })

    const t0 = Date.now()
    await sleep(600 + Math.random() * 700)

    if (node.id === faultNodeId) {
      entry.status = 'error'
      entry.endTime = new Date().toISOString()
      entry.durationMs = Date.now() - t0
      entry.error = '模拟执行出错：上游服务暂时不可用（演示用随机故障，点击重试可恢复）'
      finalStatus = 'error'
      finalError = `节点「${entry.nodeName}」执行失败`
      failedNodeId = node.id
      onEvent({ type: 'node-status', nodeId: node.id, status: 'error' })
      await persist()
      break
    }

    const { output, passed } = executeNode(node, prevOutput)
    entry.status = 'success'
    entry.endTime = new Date().toISOString()
    entry.durationMs = Date.now() - t0
    entry.output = output
    prevOutput = output
    onEvent({ type: 'node-status', nodeId: node.id, status: 'success' })
    await persist()

    // 决定下一个节点：条件节点按判断结果走分支，其余走第一条出边
    const outgoing = edges.filter((e) => e.source === node.id)
    if (node.type === 'condition') {
      currentId = (passed ? outgoing[0]?.target : outgoing[1]?.target) ?? null
    } else {
      currentId = outgoing[0]?.target ?? null
    }
  }

  const finishedAt = new Date().toISOString()
  await updateExecution(execution.id, {
    status: finalStatus,
    finished_at: finishedAt,
    result: finalStatus === 'success' ? `成功执行 ${executed.size} 个节点` : null,
    error: finalError,
  })
  onEvent({ type: 'done', status: finalStatus, failedNodeId })

  return { status: finalStatus, failedNodeId, executionId: execution.id }
}
