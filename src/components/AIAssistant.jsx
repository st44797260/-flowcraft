import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Send, Sparkles, X } from 'lucide-react'
import { getAssistantReply } from '../lib/assistant'
import { listChatMessages, saveChatMessage } from '../lib/chat'
import { cn } from '../lib/utils'

const WELCOME =
  '你好！我是 FlowCraft 助手。可以帮你：1）理解平台功能；2）推荐合适的工作流模板；3）解答配置问题。试试问我"怎么创建工作流"？'

/** 打字机效果：enabled 时把 fullText 按字符逐步显示，结束后回调 onDone */
function useTypewriter(fullText, enabled, onDone) {
  const [visible, setVisible] = useState(enabled ? '' : fullText)
  // onDone 通过 ref 传入，避免父组件每次渲染的新闭包重启打字动画
  const doneRef = useRef(() => {})

  useEffect(() => {
    doneRef.current = onDone
  })

  useEffect(() => {
    if (!enabled) return
    let index = 0
    const timer = setInterval(() => {
      index += 2
      setVisible(fullText.slice(0, index))
      if (index >= fullText.length) {
        clearInterval(timer)
        doneRef.current?.()
      }
    }, 24)
    return () => clearInterval(timer)
  }, [fullText, enabled])

  return enabled ? visible : fullText
}

function StreamingMessage({ content, streaming, onDone }) {
  const visible = useTypewriter(content, streaming, onDone)
  return (
    <span>
      {visible}
      {streaming && <span className="typing-cursor" />}
    </span>
  )
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }])
  const [streaming, setStreaming] = useState(false)
  const listRef = useRef(null)
  const historyLoaded = useRef(false)

  // 首次展开时恢复历史对话
  useEffect(() => {
    if (!open || historyLoaded.current) return
    historyLoaded.current = true
    listChatMessages()
      .then((history) => {
        if (history.length > 0) {
          setMessages([{ role: 'assistant', content: WELCOME }, ...history])
        }
      })
      .catch(() => {})
  }, [open])

  // 新消息时滚动到底部
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    saveChatMessage('user', text).catch(() => {})

    const reply = getAssistantReply(text)
    setMessages((m) => [...m, { role: 'assistant', content: reply, streaming: true }])
    setStreaming(true)
  }

  // 流式打完后持久化完整回复
  const finishStreaming = (reply) => {
    setStreaming(false)
    setMessages((m) => {
      const copy = [...m]
      copy[copy.length - 1] = { role: 'assistant', content: reply }
      return copy
    })
    saveChatMessage('assistant', reply).catch(() => {})
  }

  return (
    <>
      {/* 悬浮按钮：青色渐变 + 脉冲光晕 */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setOpen(true)}
            title="FlowCraft 助手"
            className="assistant-fab fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white transition hover:scale-105 active:scale-95"
          >
            <Sparkles className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 对话窗口：400px 宽 × 600px 高 */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="card fixed bottom-6 right-6 z-50 flex h-[600px] max-h-[calc(100vh-3rem)] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden"
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                FlowCraft 助手
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  title="最小化"
                  className="rounded-md p-1.5 text-muted transition hover:bg-white/10 hover:text-foreground"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  title="关闭"
                  className="rounded-md p-1.5 text-muted transition hover:bg-white/10 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 消息列表 */}
            <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => {
                const isLast = i === messages.length - 1
                return (
                  <div
                    key={i}
                    className={cn(
                      'max-w-[85%] rounded-xl border px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap',
                      m.role === 'user'
                        ? 'ml-auto border-primary/30 bg-primary/15 text-foreground'
                        : 'border-white/10 bg-surface-raised/80 text-muted',
                    )}
                  >
                    {m.streaming && isLast ? (
                      <StreamingMessage
                        content={m.content}
                        streaming
                        onDone={() => finishStreaming(m.content)}
                      />
                    ) : (
                      m.content
                    )}
                  </div>
                )
              })}
            </div>

            {/* 输入区 */}
            <div className="border-t border-white/10 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  placeholder="输入你的问题…（Enter 发送）"
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-foreground outline-none placeholder:text-muted/60 focus:border-primary/50"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={streaming}
                  title="发送"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-cyan-600 text-background transition hover:brightness-110 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
