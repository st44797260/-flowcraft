import { useEffect, useState } from 'react'
import { animate, motion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CheckCircle, Clock, Layers, Play } from 'lucide-react'
import { getDashboardData } from '../lib/dashboard'

/** 数字滚动动画：从 0 过渡到目标值 */
function CountUp({ value, decimals = 0 }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [value])

  return <>{display.toFixed(decimals)}</>
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    fontSize: 12,
    color: '#F9FAFB',
  },
  itemStyle: { color: '#F9FAFB' },
  labelStyle: { color: '#9CA3AF' },
}

function StatCard({ icon: Icon, label, value, suffix, decimals = 0, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card flex items-center gap-4 p-5"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}1A`, color }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-2xl font-bold text-foreground">
          <CountUp value={value} decimals={decimals} />
          {suffix && <span className="ml-1 text-sm font-medium text-muted">{suffix}</span>}
        </p>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    getDashboardData()
      .then(setData)
      .catch((e) => console.error('[FlowCraft] 看板数据加载失败', e))
  }, [])

  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-20 animate-pulse bg-white/[0.03]" />
        ))}
      </div>
    )
  }

  const savedHours = data.savedMinutes / 60

  return (
    <section className="space-y-4">
      {/* 四个数据卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Layers} label="总工作流数" value={data.totalWorkflows} color="#00D4FF" delay={0} />
        <StatCard icon={Play} label="本月执行次数" value={data.monthCount} color="#3B82F6" delay={0.08} />
        <StatCard
          icon={CheckCircle}
          label="成功率"
          value={data.successRate * 100}
          decimals={1}
          suffix="%"
          color="#10B981"
          delay={0.16}
        />
        <StatCard
          icon={Clock}
          label="节省的预估时间"
          value={savedHours >= 1 ? savedHours : data.savedMinutes}
          decimals={savedHours >= 1 ? 1 : 0}
          suffix={savedHours >= 1 ? '小时' : '分钟'}
          color="#F59E0B"
          delay={0.24}
        />
      </div>

      {/* 两个图表 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">近 30 天执行趋势</p>
            {data.hasDemoData && <span className="text-[10px] text-muted">含演示数据</span>}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="count"
                name="执行次数"
                stroke="#00D4FF"
                strokeWidth={2}
                fill="url(#trendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">工作流节点类型分布</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.typeDist}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                stroke="none"
              >
                {data.typeDist.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: 12 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
