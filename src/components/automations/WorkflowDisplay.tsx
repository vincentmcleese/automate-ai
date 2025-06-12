'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Node {
  id: string
  name: string
  type: string
}

interface WorkflowDisplayProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any
}

export function WorkflowDisplay({ json }: WorkflowDisplayProps) {
  if (!json || !json.nodes || !Array.isArray(json.nodes)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The workflow data is not in a recognizable format.</p>
        </CardContent>
      </Card>
    )
  }

  const nodes = json.nodes as Node[]

  return (
    <div className="space-y-4">
      {nodes.map((node, index) => (
        <Card key={node.id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-gray-50 p-4">
            <CardTitle className="flex items-center space-x-3 text-base font-medium">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                {index + 1}
              </span>
              <span>{node.name}</span>
            </CardTitle>
            <Badge variant="outline" className="font-mono text-xs">
              {node.type}
            </Badge>
          </CardHeader>
          {/* We can render more node details here in the future */}
        </Card>
      ))}
    </div>
  )
}
