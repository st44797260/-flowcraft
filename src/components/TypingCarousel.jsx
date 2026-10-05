import { useEffect, useState } from 'react'

/**
 * 打字机轮播：逐字打出、停顿、删除、切换到下一句，循环往复。
 */
export default function TypingCarousel({
  phrases,
  typingSpeed = 110,
  deletingSpeed = 45,
  pause = 2000,
}) {
  const [text, setText] = useState('')
  const [index, setIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const phrase = phrases[index % phrases.length]
    let timer

    if (!deleting && text === phrase) {
      // 打完一句：停留后开始删除
      timer = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && text === '') {
      // 删完：切换下一句（放进宏任务，避免在 effect 内同步 setState）
      timer = setTimeout(() => {
        setDeleting(false)
        setIndex((i) => (i + 1) % phrases.length)
      })
    } else {
      timer = setTimeout(
        () => {
          setText(deleting ? phrase.slice(0, text.length - 1) : phrase.slice(0, text.length + 1))
        },
        deleting ? deletingSpeed : typingSpeed,
      )
    }
    return () => clearTimeout(timer)
  }, [text, deleting, index, phrases, typingSpeed, deletingSpeed, pause])

  return (
    <span>
      {text}
      <span className="typing-cursor" />
    </span>
  )
}
