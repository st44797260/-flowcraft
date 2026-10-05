import { cn } from '../lib/utils'

/** 骨架屏基础块：加载占位 */
export default function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-xl bg-white/[0.06]', className)} />
}
