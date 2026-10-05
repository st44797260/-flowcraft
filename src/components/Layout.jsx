import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import AIAssistant from './AIAssistant'
import { cn } from '../lib/utils'

const NAV_LINKS = [
  { to: '/', label: '工作流', end: true },
  { to: '/templates', label: '模板市场' },
  { to: '/executions', label: '执行历史' },
]

function BoltIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" />
    </svg>
  )
}

function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export default function Layout({ children }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  // 编辑器页面有自己的 AI 面板，且右下角是 MiniMap，隐藏全局悬浮助手
  const isEditorPage = location.pathname.startsWith('/workflow')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 路由变化时收起移动端菜单（菜单内链接点击时也会收起）
  // 注意：不在 effect 里同步 setState，改由链接点击触发

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏：固定 + 毛玻璃，滚动后加阴影 */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-all duration-300',
          scrolled || mobileOpen
            ? 'border-white/10 bg-background/80 shadow-lg shadow-black/30'
            : 'border-transparent bg-background/60',
        )}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* 左侧 Logo：发光的闪电图标 + FlowCraft */}
          <NavLink to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white shadow-[0_0_18px_rgba(0,212,255,0.55)]">
              <BoltIcon className="h-4.5 w-4.5 drop-shadow-[0_0_5px_rgba(255,255,255,0.9)]" />
            </span>
            <span className="text-lg font-bold tracking-tight">FlowCraft</span>
          </NavLink>

          {/* 中间导航链接（平板/桌面） */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-colors active:scale-95',
                    isActive
                      ? 'bg-white/10 text-primary'
                      : 'text-muted hover:bg-white/5 hover:text-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* 右侧新建工作流按钮：青色渐变 */}
            <button
              type="button"
              onClick={() => navigate('/workflow/new')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-cyan-600 px-3 py-2 text-sm font-semibold text-background shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-95 sm:px-4"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">新建工作流</span>
            </button>

            {/* 移动端汉堡菜单 */}
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              title={mobileOpen ? '关闭菜单' : '打开菜单'}
              className="rounded-lg p-2 text-foreground transition hover:bg-white/10 active:scale-95 md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* 移动端菜单面板 */}
        {mobileOpen && (
          <div className="border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'mt-1 block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-white/10 text-primary' : 'text-muted hover:bg-white/5 hover:text-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* 页面主体：限宽居中 + 四周留白（顶部为固定导航栏让出高度），过渡动画由 PageTransition 承担 */}
      <main className="mx-auto w-full max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* 全局 AI 助手（编辑器页除外） */}
      {!isEditorPage && <AIAssistant />}
    </div>
  )
}
