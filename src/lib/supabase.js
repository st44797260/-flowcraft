import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// .env.local 中是占位符或缺失时，客户端仍可导出但不可用，避免应用启动即抛错
export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) && /^https?:\/\//.test(supabaseUrl)

if (!isSupabaseConfigured) {
  console.warn(
    '[FlowCraft] Supabase 未配置：请在 .env.local 中填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY，修改后需重启 dev server',
  )
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'public-anon-key',
)
