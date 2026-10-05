import BaseNode from './BaseNode'
import { conditionConfig } from './configs'

export default function ConditionNode(props) {
  return <BaseNode {...props} config={conditionConfig} />
}
