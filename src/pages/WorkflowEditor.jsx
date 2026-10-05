import { useParams } from 'react-router-dom'

export default function WorkflowEditor() {
  const { id } = useParams()

  return <h1 className="text-3xl font-bold">工作流编辑器{`(ID: ${id})`}</h1>
}
