import BaseNode from './BaseNode'
import { triggerConfig } from './configs'

export default function TriggerNode(props) {
  return <BaseNode {...props} config={triggerConfig} />
}
