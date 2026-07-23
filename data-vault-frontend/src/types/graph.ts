export type GraphNode = {
  id: string
  label: string
  visits: number
  group?: string
}

export type GraphLink = {
  source: string
  target: string
  weight: number
}
