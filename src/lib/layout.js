import dagre from '@dagrejs/dagre'

export const NODE_WIDTH = 224
export const NODE_HEIGHT = 112

/** 用 dagre 从左到右整理节点位置，返回 id → {x, y}（左上角坐标） */
export function layoutGraph(nodes, edges, { nodesep = 60, ranksep = 140 } = {}) {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'LR', nodesep, ranksep })
  nodes.forEach((n) =>
    graph.setNode(n.id, { width: n.width ?? NODE_WIDTH, height: n.height ?? NODE_HEIGHT }),
  )
  edges.forEach((e) => graph.setEdge(e.source, e.target))
  dagre.layout(graph)
  const positions = new Map()
  for (const n of nodes) {
    const p = graph.node(n.id)
    const w = n.width ?? NODE_WIDTH
    const h = n.height ?? NODE_HEIGHT
    if (p) positions.set(n.id, { x: p.x - w / 2, y: p.y - h / 2 })
  }
  return positions
}
