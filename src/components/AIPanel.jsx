import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, X } from 'lucide-react'
import { cn } from '../lib/utils'

/** 画布右侧可折叠的 AI 对话面板 */
export default function AIPanel({ open, messages, busy, onSend, onClose }) {
  const [input, setInput] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, busy])

  const submit = () => {
    const text = input.trim()
    if (!text || busy) return
    onSend(text)
    setInput('')
  }

  if (!open) return null

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-white/10 bg-surface/60 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-sm font-bold">
          <Sparkles className="h-4 w-4 text-primary" />
          AI 助手
        </span>
        <button
          type="button"
          onClick={onClose}
          title="收起面板"
          className="rounded-md p-1 text-muted transition hover:bg-white/10 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              'max-w-[85%] rounded-xl border px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap',
              m.role === 'user'
                ? 'ml-auto border-primary/30 bg-primary/15 text-foreground'
                : 'border-white/10 bg-white/5 text-muted',
            )}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="w-fit rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted">
            AI 正在修改画布…
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={'试试："再加一个条件判断"、"把AI节点改成用GPT-4"'}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-foreground outline-none placeholder:text-muted/60 focus:border-primary/50"
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            title="发送"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-cyan-600 text-background transition hover:brightness-110 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
