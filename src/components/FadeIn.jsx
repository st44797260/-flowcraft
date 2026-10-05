import { motion } from 'framer-motion'

/** 进入视口时淡入 + 上移（全站滚动动效的基础组件） */
export default function FadeIn({ children, delay = 0, y = 16, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
