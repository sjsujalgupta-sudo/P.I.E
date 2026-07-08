/*
 * 🎭 Analogy: This file is the "Neural Map Room" — it's the page
 *   that renders your browsing history as an interactive neural
 *   network. Each URL is a glowing node, each navigation a pathway.
 * ✅ Safe to change:
 *    1. The page title shown in the browser tab (metadata)
 *    2. The outer container background color
 *    3. Add a loading skeleton before the graph mounts
 * ❌ Never touch: The `absolute inset-0` positioning — this is what
 *   lets Synapse escape the layout padding and fill the full screen,
 *   exactly like the History page does.
 */
'use client'

import SynapseGraph from '@/components/synapse/SynapseGraph'
import { Suspense } from 'react'

export default function SynapsePage() {
  return (
    // absolute inset-0 escapes the layout padding wrapper so the graph
    // fills the full available canvas area — same pattern as History page
    <div className="absolute inset-0 overflow-hidden">
      <Suspense fallback={null}>
        <SynapseGraph />
      </Suspense>
    </div>
  )
}
