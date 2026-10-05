import { motion } from 'framer-motion'
import { GitBranch, Globe, Play, Send, Sparkles } from 'lucide-react'

const PIPELINE = [
  { label: '触发', icon: Play, color: '#00D4FF' },
  { label: '抓取', icon: Globe, color: '#3B82F6' },
  { label: 'AI处理', icon: Sparkles, color: '#7C3AED' },
  { label: '条件判断', icon: GitBranch, color: '#F59E0B' },
  { label: '输出', icon: Send, color: '#10B981' },
]

/** 生成中的全屏遮罩：节点依次点亮的动画 */
export default function GenerationOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="card flex flex-col items-center gap-6 px-10 py-8">
        <p className="flex items-center gap-2 text-lg font-bold">
          <Sparkles className="h-5 w-5 text-primary" />
          AI 正在编排你的工作流…
        </p>
        <div className="flex items-center gap-4">
          {PIPELINE.map(({ label, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              className="flex flex-col items-center gap-1.5"
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.95, 1.08, 0.95] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl border"
                style={{
                  borderColor: `${color}66`,
                  background: `${color}1A`,
                  color,
                  boxShadow: `0 0 16px ${color}40`,
                }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs" style={{ color }}>
                {label}
              </span>
            </motion.div>
          ))}
        </div>
        <p className="text-sm text-muted">节点依次点亮中，即将跳转到编辑器…</p>
      </div>
    </div>
  )
}
