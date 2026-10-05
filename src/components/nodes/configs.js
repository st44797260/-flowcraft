import { GitBranch, Globe, Play, Send, Sparkles } from 'lucide-react'

/** 5 种节点类型的外观配置：颜色同时用于边框、发光、MiniMap */
export const triggerConfig = {
  type: 'trigger',
  title: '触发',
  icon: Play,
  color: '#00D4FF',
}

export const scrapeConfig = {
  type: 'scrape',
  title: '抓取',
  icon: Globe,
  color: '#3B82F6',
}

export const aiConfig = {
  type: 'ai',
  title: 'AI处理',
  icon: Sparkles,
  color: '#7C3AED',
}

export const conditionConfig = {
  type: 'condition',
  title: '条件判断',
  icon: GitBranch,
  color: '#F59E0B',
}

export const outputConfig = {
  // 注意：不能用 'output'——与 React Flow 内置节点类型撞名会引入默认样式
  type: 'outputNode',
  title: '输出',
  icon: Send,
  color: '#10B981',
}
