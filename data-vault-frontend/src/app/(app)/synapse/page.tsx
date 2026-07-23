'use client'

import { SynapseEngine } from '@/components/synapse/SynapseEngine';

export default function SynapsePage() {
  return (
    // absolute inset-0 escapes the layout padding wrapper so the graph
    // fills the full available canvas area — same pattern as History page
    <div className="absolute inset-0 overflow-hidden bg-[#050505]">
      <SynapseEngine />
    </div>
  )
}
