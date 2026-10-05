import BaseNode from './BaseNode'
import { scrapeConfig } from './configs'

export default function ScrapeNode(props) {
  return <BaseNode {...props} config={scrapeConfig} />
}
