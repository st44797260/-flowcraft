import TriggerNode from './TriggerNode'
import ScrapeNode from './ScrapeNode'
import AINode from './AINode'
import ConditionNode from './ConditionNode'
import OutputNode from './OutputNode'
import {
  aiConfig,
  conditionConfig,
  outputConfig,
  scrapeConfig,
  triggerConfig,
} from './configs'

/** React Flow nodeTypes 注册表 */
export const NODE_TYPES = {
  trigger: TriggerNode,
  scrape: ScrapeNode,
  ai: AINode,
  condition: ConditionNode,
  outputNode: OutputNode,
}

/** 添加节点菜单用的类型列表 */
export const NODE_TYPE_LIST = [
  triggerConfig,
  scrapeConfig,
  aiConfig,
  conditionConfig,
  outputConfig,
]

/** type → config 快查表（MiniMap 颜色等） */
export const NODE_TYPE_MAP = Object.fromEntries(NODE_TYPE_LIST.map((c) => [c.type, c]))
