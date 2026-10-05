import { isSupabaseConfigured, supabase } from './supabase'

// 聊天记录持久化：session_id 用 localStorage 生成并持久化。
// 配置了 Supabase 走 chat_logs 表，否则存 localStorage（演示模式）。

const SESSION_KEY = 'flowcraft.chatSession'
const LS_KEY = 'flowcraft.chatLogs'

export function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) ?? []
  } catch {
    return []
  }
}

export async function listChatMessages() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('chat_logs')
      .select('role, content, created_at')
      .eq('session_id', getSessionId())
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map((m) => ({ role: m.role, content: m.content }))
  }
  return readLocal()
    .filter((m) => m.session_id === getSessionId())
    .map((m) => ({ role: m.role, content: m.content }))
}

export async function saveChatMessage(role, content) {
  const session_id = getSessionId()
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('chat_logs').insert({ session_id, role, content })
    if (error) throw error
    return
  }
  const list = readLocal()
  list.push({ id: crypto.randomUUID(), session_id, role, content, created_at: new Date().toISOString() })
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}
