import { isSupabaseConfigured, supabase } from './supabase'

// 工作流数据访问层：配置了 Supabase 走数据库，否则降级到 localStorage（演示模式）

export const dataMode = isSupabaseConfigured ? 'supabase' : 'local'

if (!isSupabaseConfigured) {
  console.warn(
    '[FlowCraft] 未配置 Supabase，工作流数据将保存在浏览器 localStorage（演示模式）。建表 SQL 见 supabase/schema.sql',
  )
}

const LS_KEY = 'flowcraft.workflows'

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

function withTimestamps(record) {
  const now = new Date().toISOString()
  return {
    ...record,
    created_at: record.created_at ?? now,
    updated_at: now,
  }
}

export async function listWorkflows() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
  return readLocal().sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
}

export async function getWorkflow(id) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('workflows').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data
  }
  return readLocal().find((w) => w.id === id) ?? null
}

export async function createWorkflow({ name, description, nodes, edges, status = 'draft' }) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('workflows')
      .insert({ name, description, nodes, edges, status })
      .select()
      .single()
    if (error) throw error
    return data
  }
  const record = withTimestamps({
    id: crypto.randomUUID(),
    name,
    description,
    nodes,
    edges,
    status,
  })
  writeLocal([record, ...readLocal()])
  return record
}

export async function updateWorkflow(id, patch) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('workflows')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const list = readLocal()
  const index = list.findIndex((w) => w.id === id)
  if (index === -1) throw new Error('工作流不存在')
  list[index] = withTimestamps({ ...list[index], ...patch })
  writeLocal(list)
  return list[index]
}

export async function deleteWorkflow(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('workflows').delete().eq('id', id)
    if (error) throw error
    return
  }
  writeLocal(readLocal().filter((w) => w.id !== id))
}
