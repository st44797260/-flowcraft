import { clsx } from 'clsx'

/** 条件类名合并工具：cn('a', cond && 'b') */
export function cn(...inputs) {
  return clsx(...inputs)
}

/** 相对时间："刚刚" / "5 分钟前" / "3 天前" */
export function formatRelativeTime(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return new Date(iso).toLocaleDateString()
}

