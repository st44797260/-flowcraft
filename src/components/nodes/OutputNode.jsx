import BaseNode from './BaseNode'
import { outputConfig } from './configs'

export default function OutputNode(props) {
  return <BaseNode {...props} config={outputConfig} />
}
