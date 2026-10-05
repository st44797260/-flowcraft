import { isSupabaseConfigured, supabase } from './supabase'

// 执行记录数据层：配置了 Supabase 走数据库（含 Realtime 订阅），
// 否则降级到 localStorage + 本地事件总线（演示模式的"实时"）。

export const dataMode = isSupabaseConfigured ? 'supabase' : 'local'

const LS_KEY = 'flowcraft.executions'

// 本地事件总线：模拟 Supabase Realtime 的变更推送
const emitter = new EventTarget()

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) ?? []
  } catch {
    return []
  }
}

function writeLocal(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

function notifyLocal(record) {
  emitter.dispatchEvent(new CustomEvent('change', { detail: record }))
}

function sortDesc(list) {
  return [...list].sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? ''))
}

/** 订阅执行记录变更（任意一条 insert/update 都会推送给回调），返回取消订阅函数 */
export function subscribeExecutions(callback) {
  if (isSupabaseConfigured) {
    const channel = supabase
      .channel('executions-stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'executions' },
        (payload) => callback(payload.new),
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }
  const handler = (event) => callback(event.detail)
  emitter.addEventListener('change', handler)
  return () => emitter.removeEventListener('change', handler)
}

export async function listExecutions({ workflowId } = {}) {
  if (isSupabaseConfigured) {
    let query = supabase.from('executions').select('*').order('started_at', { ascending: false })
    if (workflowId) query = query.eq('workflow_id', workflowId)
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }
  const list = readLocal().filter((e) => !workflowId || e.workflow_id === workflowId)
  return sortDesc(list)
}

export async function getExecution(id) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('executions').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data
  }
  return readLocal().find((e) => e.id === id) ?? null
}

export async function createExecution({ workflow_id, status = 'running', started_at, logs = [] }) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('executions')
      .insert({ workflow_id, status, started_at, logs })
      .select()
      .single()
    if (error) throw error
    return data
  }
  const record = {
    id: crypto.randomUUID(),
    workflow_id,
    status,
    started_at: started_at ?? new Date().toISOString(),
    finished_at: null,
    logs,
    result: null,
    error: null,
  }
  writeLocal([record, ...readLocal()])
  notifyLocal(record)
  return record
}

export async function updateExecution(id, patch) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('executions')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const list = readLocal()
  const index = list.findIndex((e) => e.id === id)
  if (index === -1) throw new Error('执行记录不存在')
  list[index] = { ...list[index], ...patch }
  writeLocal(list)
  notifyLocal(list[index])
  return list[index]
}
