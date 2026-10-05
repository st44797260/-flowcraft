import { BaseEdge, getBezierPath } from '@xyflow/react'

// 贝塞尔曲线连线：青→紫渐变描边 + 流动虚线叠层，选中加粗
export default function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })
  const gradientId = `edge-gradient-${id}`

  return (
    <>
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={sourceX}
          y1={sourceY}
          x2={targetX}
          y2={targetY}
        >
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* React Flow 的 .react-flow__edge-path 规则会覆盖 stroke 属性，
          因此描边必须用内联 style 才能让渐变生效 */}
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth: selected ? 3 : 2,
        }}
      />
      {/* 流动虚线叠层（纯装饰，不响应鼠标） */}
      <path
        d={path}
        fill="none"
        stroke="#7DE7FF"
        strokeWidth={selected ? 2 : 1.5}
        strokeLinecap="round"
        opacity={0.75}
        className="edge-flow-dash pointer-events-none"
      />
    </>
  )
}
