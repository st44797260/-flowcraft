import BaseNode from './BaseNode'
import { aiConfig } from './configs'

export default function AINode(props) {
  return <BaseNode {...props} config={aiConfig} />
}
