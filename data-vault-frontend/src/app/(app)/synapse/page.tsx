'use client'

import { NotebookMindmap } from '@/components/synapse/NotebookMindmap';

export default function SynapsePage() {
  return (
    // We override the layout paddings by using absolute inset-0 
    // to fill the screen like NotebookLM
    <div className="absolute inset-0 overflow-hidden bg-[#111318]">
      <NotebookMindmap />
    </div>
  )
}
