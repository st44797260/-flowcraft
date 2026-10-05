import { clsx } from 'clsx'

/** 条件类名合并工具：cn('a', cond && 'b') */
export function cn(...inputs) {
  return clsx(...inputs)
}
