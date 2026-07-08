/*
 * 🎭 Analogy: This file is the "Neural Map Engine" — it renders
 *   your browsing history as a living neural network where each
 *   website is a glowing node and each navigation is a pathway.
 * ✅ Safe to change:
 *    1. NODE_COLORS — swap the hex values to retheme the graph colors
 *    2. The layers array — add/remove node groups or rename them
 *    3. Playback speed options (0.5, 1, 2, 4) in the speed buttons
 * ❌ Never touch: The ForceGraph2D nodeCanvasObject painter — this is
 *   the finalized visual logic. Changing it breaks the graph rendering.
 */
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search,
  Activity,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Pause,
  Settings
} from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import { BirthSky } from '@/components/home/BirthSky'
import { fetchVaultData } from '@/lib/api'
import { vaultRowsToSynapseGraph, type SynapseGraphData } from '@/lib/captured-data-adapters'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

function endpointId(endpoint: string | { id: string }) {
  return typeof endpoint === 'object' ? endpoint.id : endpoint
}

export default function SynapseGraph() {
  const fgRef = useRef<any>(null)
  const hasFitted = useRef(false)
  const [mounted, setMounted] = useState(false)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoverNode, setHoverNode] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [highlightNodes, setHighlightNodes] = useState(new Set<any>())
  const [lastFocusedNode, setLastFocusedNode] = useState<any>(null)
  const [activeRange, setActiveRange] = useState('Year')
  const [playbackMode, setPlaybackMode] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [capturedGraph, setCapturedGraph] = useState<SynapseGraphData>({ nodes: [], links: [] })
  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading')
  const searchParams = useSearchParams()

  // Sync with Dynamic Island Nav
  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'playback') {
      setPlaybackMode(true)
      setIsPlaying(true)
    } else if (mode === 'static') {
      setPlaybackMode(false)
    }
  }, [searchParams])

  useEffect(() => { setMounted(true) }, [])

  // ==========================================
  // DATA LOADING
  // Fetches the user's browsing data from the vault and converts it into graph format
  // ==========================================
  useEffect(() => {
    let alive = true
    async function loadCapturedData() {
      try {
        const rows = await fetchVaultData()
        if (!alive) return
        setCapturedGraph(vaultRowsToSynapseGraph(rows))
        setDataStatus(rows.length ? 'ready' : 'empty')
      } catch {
        if (!alive) return
        setCapturedGraph({ nodes: [], links: [] })
        setDataStatus('error')
      }
    }

    loadCapturedData()
    return () => { alive = false }
  }, [])

  // ==========================================
  // TEMPORAL PLAYBACK ENGINE
  // Advances the time clock during playback mode to simulate the sequential formation of the network
  // ==========================================
  useEffect(() => {
    if (!isPlaying || !playbackMode) return
    const interval = setInterval(() => {
      setPlaybackTime((prev) => {
        if (prev > 130000) return 0
        return prev + 16 * playbackSpeed
      })
    }, 16)
    return () => clearInterval(interval)
  }, [isPlaying, playbackMode, playbackSpeed])

  const NODE_COLORS = {
    start:        { core: '#00ff44', glow: 'rgba(0,255,68,1)' },   // Hyper Neon Green
    active:       { core: '#00e5ff', glow: 'rgba(0,229,255,1)' },   // Electric Cyan
    intermediate: { core: '#d000ff', glow: 'rgba(208,0,255,1)' },   // Magenta/Purple
    context:      { core: '#fff200', glow: 'rgba(255,242,0,1)' },   // Radioactive Yellow
    end:          { core: '#ff0055', glow: 'rgba(255,0,85,1)' }     // Laser Pink/Red
  }

  const graphData = useMemo(() => {
    if (!mounted) return { nodes: [], links: [] }
    return capturedGraph
  }, [mounted, capturedGraph])

  // ==========================================
  // GRAPH FILTERING & COMPUTATION
  // ==========================================

  // Filters the complete graph based on the active time range (e.g., last Hour, Day, Week)
  const getFilteredGraph = () => {
    const now = Date.now()
    const thresholds: Record<string, number> = {
      Hour: now - 1000 * 60 * 60,
      Day:  now - 1000 * 60 * 60 * 24,
      Week: now - 1000 * 60 * 60 * 24 * 7,
      Month:now - 1000 * 60 * 60 * 24 * 30,
      Year: now - 1000 * 60 * 60 * 24 * 365,
    }
    const threshold = thresholds[activeRange] ?? 0
    
    // Filter nodes by their first visit time in this range
    const filteredNodes = graphData.nodes.filter((n) => n.realTimestamp > threshold)
    const ids = new Set(filteredNodes.map((n) => n.id))
    
    // Filter links: only show links that actually happened in this time range
    // and whose source/target nodes are still visible
    const filteredLinks = graphData.links.filter((l) => 
      l.realTimestamp > threshold &&
      ids.has(endpointId(l.source)) && 
      ids.has(endpointId(l.target))
    )
    
    return { nodes: filteredNodes, links: filteredLinks }
  }

  // Memoized final graph data that accounts for both the selected time range and the playback timeline
  const finalGraph = useMemo(() => {
    const fg = getFilteredGraph()
    
    // In playback mode, only show nodes that have "emerged" by the current playback clock
    const playbackNodes = playbackMode ? fg.nodes.filter((n) => n.timestamp <= playbackTime) : fg.nodes
    const nodeIds = new Set(playbackNodes.map((n) => n.id))
    
    // In playback mode, only show links that have "emerged" by the current playback clock
    const playbackLinks = playbackMode
      ? fg.links.filter((l) => l.timestamp <= playbackTime && nodeIds.has(endpointId(l.source)) && nodeIds.has(endpointId(l.target)))
      : fg.links
      
    return { nodes: playbackNodes, links: playbackLinks }
  }, [graphData, activeRange, playbackMode, playbackTime])

  // Determines the correct color/state of a node dynamically during playback
  const getTemporalState = (node: any) => {
    if (!node.timeline) return node.group
    let current = node.timeline[0]
    for (const step of node.timeline) { if (playbackTime >= step.time) current = step }
    return current.state
  }

  const handleNodeClick = (node: any) => { 
    setSelectedNode(node)
    setHighlightNodes(new Set([node]))
  }
  const resetPath = () => { setSelectedNode(null); setHighlightNodes(new Set()) }
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    const found = finalGraph.nodes.find((n) => n.label.toLowerCase().includes(value.toLowerCase()))
    if (found) { handleNodeClick(found); fgRef.current?.centerAt(found.x, found.y, 800); fgRef.current?.zoom(2.2, 800) }
  }

  // ==========================================
  // GRAPH PHYSICS & CAMERA CONTROLS
  // ==========================================

  useEffect(() => {
    if (!mounted || !fgRef.current) return
    const fg = fgRef.current
    // Massively increase repulsion so nodes naturally fill the screen space
    fg.d3Force('charge').strength(-5000)
    fg.d3Force('link').distance(400)
    fg.d3ReheatSimulation?.()
  }, [mounted])

  // Camera tracking: Smoothly follows the most recently emerged node during active playback
  useEffect(() => {
    if (finalGraph.nodes.length > 0 && playbackMode) {
      const active = finalGraph.nodes.filter((n: any) => getTemporalState(n) !== 'context')
      if (active.length > 0) {
        const last = active[active.length - 1]
        if (last && last !== lastFocusedNode) {
          setLastFocusedNode(last)
          fgRef.current?.centerAt(last.x, last.y, 1200)
          fgRef.current?.zoom(2.2, 1400)
        }
      }
    } else if (finalGraph.nodes.length > 0) {
      hasFitted.current = false
    }
  }, [finalGraph.nodes, playbackMode, lastFocusedNode])

  // Removed cinematic drift effect to prevent the graph from continuously moving away from the pointer


  return (
    <div className="relative w-full h-full overflow-hidden bg-[#020617]">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
        <Canvas camera={{ position: [0, 0, 80], fov: 60 }}>
          <BirthSky />
        </Canvas>
      </div>

      {(dataStatus === 'loading' || dataStatus === 'empty' || dataStatus === 'error') && (
        <div className="absolute left-1/2 top-24 z-20 -translate-x-1/2 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
          {dataStatus === 'loading'
            ? 'Loading captured browsing data...'
            : dataStatus === 'empty'
              ? 'No captured browsing data yet.'
              : 'Could not load captured browsing data.'}
        </div>
      )}

      {/* Force Graph */}
      <div className="absolute inset-0">
        {mounted && (
          <ForceGraph2D
            ref={fgRef}
            graphData={finalGraph}
            backgroundColor="transparent"
            cooldownTicks={150}
            d3AlphaDecay={0.03}
            enableNodeDrag={true}
            d3VelocityDecay={0.7}
            onEngineStop={() => {
              if (!hasFitted.current) {
                fgRef.current?.zoomToFit(800, 40)
                hasFitted.current = true
              }
            }}
            onNodeClick={handleNodeClick}
            onNodeHover={(node) => setHoverNode(node)}
            linkCurvature={0.22}
            linkDirectionalParticles={(link: any) => {
              const linkTime = link.timestamp || 0
              const recent = playbackMode && (playbackTime - linkTime > 0) && (playbackTime - linkTime < 1800)
              if (recent) return 6
              if (highlightNodes.has(link.source) || highlightNodes.has(link.target)) return 5
              return 0
            }}
            linkDirectionalParticleWidth={3}
            linkDirectionalParticleSpeed={0.008}
            linkDirectionalParticleColor={() => '#ffffff'}
            linkWidth={(link: any) => {
              const linkTime = link.timestamp || 0
              const recent = playbackMode && (playbackTime - linkTime > 0) && (playbackTime - linkTime < 1800)
              if (recent) return 3.5
              if (highlightNodes.has(link.source) || highlightNodes.has(link.target)) return 3
              if (!playbackMode) return 0.7
              return playbackTime >= linkTime ? 0.7 : 0
            }}
            linkColor={(link: any) => {
              const linkTime = link.timestamp || 0
              const recent = playbackMode && (playbackTime - linkTime > 0) && (playbackTime - linkTime < 1800)
              if (recent) return '#ffffff'
              if (highlightNodes.has(link.source) || highlightNodes.has(link.target)) return '#ffffff'
              return 'rgba(255,255,255,0.08)'
            }}
             nodePointerAreaPaint={(node: any, color, ctx) => {
              if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return
              let emergence = 1
              if (playbackMode) {
                const age = playbackTime - node.timestamp
                emergence = Math.max(0, Math.min(age / 1200, 1))
              }
              if (emergence <= 0) return
              
              let renderX = node.x
              let renderY = node.y
              if (playbackMode && emergence < 1 && node.originNodeId) {
                const origin = finalGraph.nodes.find((n) => n.id === node.originNodeId)
                if (origin) { renderX = origin.x + (node.x - origin.x) * emergence; renderY = origin.y + (node.y - origin.y) * emergence }
              }

              const baseR = Math.max(16, Math.min(42, 12 + (node.visits * 3)))
              const hitRadius = baseR * 2.5 * emergence
              
              ctx.beginPath()
              ctx.arc(renderX, renderY, hitRadius, 0, 2 * Math.PI)
              ctx.fillStyle = color
              ctx.fill()
            }}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return
              let emergence = 1
              if (playbackMode) {
                const age = playbackTime - node.timestamp
                emergence = Math.max(0, Math.min(age / 1200, 1))
              }
              if (emergence <= 0) return
              
              let renderX = node.x
              let renderY = node.y
              if (playbackMode && emergence < 1 && node.originNodeId) {
                const origin = finalGraph.nodes.find((n) => n.id === node.originNodeId)
                if (origin) { renderX = origin.x + (node.x - origin.x) * emergence; renderY = origin.y + (node.y - origin.y) * emergence }
              }
              
              const currentState = playbackMode ? getTemporalState(node) : node.group
              const color = NODE_COLORS[currentState as keyof typeof NODE_COLORS]?.core || NODE_COLORS.active.core
              
              const isSelected = selectedNode?.id === node.id
              const hasSelection = !!selectedNode
              const isHovered = hoverNode?.id === node.id
              const isHighlighted = highlightNodes.has(node)
              const isDimmed = hasSelection && !isHighlighted
              
              const baseR = Math.max(16, Math.min(42, 12 + (node.visits * 3)))
              const r = baseR * emergence
              
              // Outer glow (Cyberpunk Neon style)
              try {
                  const glowMult = isHovered ? 4.5 : isSelected ? 3.5 : 2.5;
                  const glowRadius = Math.max(r * 1.5, r * glowMult);
                  const innerR = Math.min(r * 0.4, glowRadius - 0.1);
                  const glowAlpha = isHovered ? "ff" : isSelected ? "cc" : isDimmed ? "22" : "66";
                  const glow = ctx.createRadialGradient(renderX, renderY, innerR, renderX, renderY, glowRadius);
                  glow.addColorStop(0, color + glowAlpha);
                  glow.addColorStop(1, color + "00");
                  ctx.beginPath();
                  ctx.arc(renderX, renderY, glowRadius, 0, 2 * Math.PI);
                  ctx.fillStyle = glow;
                  ctx.fill();
              } catch { /* skip glow on bad state */ }

              // Neon Tube Node circle (transparent core)
              const fillAlpha = isHovered ? '99' : isSelected ? '77' : isDimmed ? '11' : '33'
              ctx.beginPath(); ctx.arc(renderX, renderY, isHovered ? r * 1.15 : r, 0, 2 * Math.PI)
              ctx.fillStyle = color + fillAlpha
              ctx.fill()

              // Bright Neon Border ring
              const strokeAlpha = isHovered ? 'ff' : isSelected ? 'ff' : isDimmed ? '22' : 'ff'
              ctx.beginPath(); ctx.arc(renderX, renderY, isHovered ? r * 1.15 : r, 0, 2 * Math.PI)
              ctx.strokeStyle = color + strokeAlpha
              ctx.lineWidth = isHovered ? 4 : isSelected ? 3 : 2.5
              ctx.stroke()
              
              // Inner Bright Ring (Hotspot)
              if (!isDimmed) {
                  ctx.beginPath(); ctx.arc(renderX, renderY, isHovered ? r * 1.15 : r, 0, 2 * Math.PI)
                  ctx.strokeStyle = '#ffffff66'
                  ctx.lineWidth = 1
                  ctx.stroke()
              }
              
              // Label (Show all if no selection, or if it's selected/hovered)
              const showLabel = isHovered || isSelected || (!hasSelection && (node.visits > 0 || globalScale > 1.2))
              if (showLabel && !isDimmed) {
                  const baseFontSize = Math.max(10, 12 / globalScale);
                  const fontSize = (isHovered || isSelected) ? baseFontSize * 1.25 : baseFontSize;
                  ctx.font = `${isHovered || isSelected ? "700" : "500"} ${fontSize}px Inter, sans-serif`;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";

                  const textWidth = ctx.measureText(node.label).width;
                  const padX = 5, padY = 3;
                  const visR = (isHovered || isSelected) ? r * 1.15 : r;
                  const lx = renderX - textWidth / 2 - padX;
                  const ly = renderY + visR + 9;
                  const lw = textWidth + padX * 2;
                  const lh = fontSize + padY * 2;
                  const rad = 4;

                  ctx.fillStyle = isHovered || isSelected ? "rgba(10,10,11,0.88)" : "rgba(10,10,11,0.65)";
                  ctx.beginPath();
                  if (ctx.roundRect) {
                      ctx.roundRect(lx, ly, lw, lh, rad);
                  } else {
                      ctx.moveTo(lx + rad, ly);
                      ctx.lineTo(lx + lw - rad, ly);
                      ctx.quadraticCurveTo(lx + lw, ly, lx + lw, ly + rad);
                      ctx.lineTo(lx + lw, ly + lh - rad);
                      ctx.quadraticCurveTo(lx + lw, ly + lh, lx + lw - rad, ly + lh);
                      ctx.lineTo(lx + rad, ly + lh);
                      ctx.quadraticCurveTo(lx, ly + lh, lx, ly + lh - rad);
                      ctx.lineTo(lx, ly + rad);
                      ctx.quadraticCurveTo(lx, ly, lx + rad, ly);
                      ctx.closePath();
                  }
                  ctx.fill();

                  if (isHovered || isSelected) {
                      ctx.strokeStyle = color + "55";
                      ctx.lineWidth = 1;
                      ctx.stroke();
                  }

                  ctx.fillStyle = isHovered || isSelected ? color : "rgba(255,255,255,0.75)";
                  ctx.fillText(node.label, renderX, ly + lh / 2);
              }
            }}
          />
        )}
      </div>

      {/* Node Details Pane */}
      {selectedNode && (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute bottom-6 left-6 z-50 w-[380px] rounded-[24px] border border-cyan-400/30 bg-black/60 p-6 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,229,255,0.15)] overflow-hidden"
        >
          {/* Cyberpunk accent line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
          
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold tracking-[0.3em] text-cyan-400 uppercase">Neural Node</div>
              <h2 className="mt-1 text-2xl font-bold text-white break-words pr-4">{selectedNode.label}</h2>
            </div>
            <button onClick={() => setSelectedNode(null)} className="rounded-full bg-white/5 p-2 text-white/50 hover:bg-white/10 hover:text-white transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="text-[9px] font-semibold tracking-widest text-white/40 uppercase">Total Visits</div>
              <div className="mt-1 text-xl font-bold text-white">{selectedNode.visits}</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="text-[9px] font-semibold tracking-widest text-white/40 uppercase">Time Engaged</div>
              <div className="mt-1 text-xl font-bold text-white">{Math.ceil((selectedNode.timeSpent || 0) / 60)} <span className="text-sm text-white/40">mins</span></div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
             <div className="text-[9px] font-semibold tracking-widest text-white/40 uppercase">URL</div>
             <a href={selectedNode.url} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-cyan-300 hover:text-cyan-200 truncate transition">
               {selectedNode.url || selectedNode.label}
             </a>
             
             {selectedNode.description && (
               <>
                 <div className="mt-4 text-[9px] font-semibold tracking-widest text-white/40 uppercase">Context</div>
                 <div className="mt-1 text-xs text-white/70 leading-relaxed line-clamp-3">
                   {selectedNode.description}
                 </div>
               </>
             )}
          </div>
        </motion.div>
      )}

      {/* Top Right Options Menu */}
      <div className="absolute top-6 right-6 z-50">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl text-white hover:bg-white/10 transition-colors shadow-lg">
          <Settings size={20} />
        </button>
        
        {sidebarOpen && (
          <div className="mt-4 w-[340px] rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] backdrop-blur-[40px] shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div>
              <h1 className="text-3xl font-semibold text-white">Synapse</h1>
              <p className="mt-1 text-xs text-white/40">Neural memory engine</p>
            </div>
            
            {/* Search */}
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
              <Search size={16} className="text-white/30" />
              <input value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search memory space..." className="w-full bg-transparent text-white outline-none placeholder:text-white/25" />
            </div>
            <button onClick={() => { resetPath(); fgRef.current?.zoomToFit(800, 120) }} className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white/70 transition hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-300">
              Reset Neural Path
            </button>

            {/* Timeline */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-3xl">
              <div className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-cyan-300">TIMELINE</div>
              <div className="relative flex rounded-xl bg-white/[0.03] p-1">
                <motion.div layout className="absolute top-1 bottom-1 rounded-[10px] bg-cyan-400/20 shadow-[0_0_30px_rgba(0,255,255,0.25)]"
                  style={{ width: '20%', left: `${['Hour','Day','Week','Month','Year'].indexOf(activeRange) * 20}%` }} />
                {['Hour','Day','Week','Month','Year'].map((range) => (
                  <button key={range} onClick={() => setActiveRange(range)} className={`relative z-10 flex-1 rounded-xl py-2 text-[10px] ${activeRange === range ? 'text-cyan-200' : 'text-white/45'}`}>{range}</button>
                ))}
              </div>
            </div>

            {/* Playback */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl border border-cyan-500/20 bg-white/[0.03] p-4 backdrop-blur-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-semibold tracking-[0.2em] text-cyan-300">TEMPORAL PLAYBACK</div>
                  <div className="mt-1 text-[10px] text-white/40">Replay neural formation</div>
                </div>
                <button onClick={() => { setPlaybackMode(!playbackMode); if (!playbackMode) { setPlaybackTime(0); setIsPlaying(true) } else { setIsPlaying(false) } }}
                  className={`rounded-lg px-3 py-1.5 text-[10px] ${playbackMode ? 'bg-cyan-400/20 text-cyan-200' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'}`}>
                  {playbackMode ? 'Disable' : 'Enable'}
                </button>
              </div>
              {playbackMode && (
                <>
                  <div className="mt-5 flex items-center justify-between">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] text-cyan-200 transition hover:bg-cyan-400/20">
                      {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>
                  </div>
                  <div className="mt-4">
                    <input type="range" min={0} max={130000} value={playbackTime} onChange={(e) => setPlaybackTime(Number(e.target.value))} className="w-full accent-cyan-400" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    {[0.5, 1, 2, 4].map((speed) => (
                      <button key={speed} onClick={() => setPlaybackSpeed(speed)}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition ${playbackSpeed === speed ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/30' : 'bg-white/[0.03] text-white/50 border border-transparent hover:bg-white/[0.08]'}`}>
                        {speed}x
                      </button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 200 }} className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div>
                <div className="flex items-center gap-2 text-[10px] text-white/45 uppercase tracking-widest"><Activity size={12} className="text-cyan-300" /> Nodes</div>
                <div className="mt-1 text-2xl font-semibold text-white">{finalGraph.nodes.length}</div>
              </div>
              <div className="h-8 w-[1px] bg-white/10" />
              <div>
                <div className="text-[10px] text-white/45 uppercase tracking-widest">Pathways</div>
                <div className="mt-1 text-2xl font-semibold text-white">{finalGraph.links.length}</div>
              </div>
            </motion.div>

            {/* Legend */}
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 200 }} className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="space-y-3">
                {([['#00ff44','Start / Input'],['#00e5ff','Active Node'],['#d000ff','Semantic Cluster'],['#fff200','Processing'],['#ff0055','Output / Terminated']] as [string,string][]).map(([color, label]) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                    <div className="text-[11px] text-white/80 font-medium">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="absolute left-8 top-8 z-50 w-[320px] rounded-[32px] border border-white/10 bg-black/55 p-6 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-semibold text-white">{selectedNode.label}</div>
              <div className="mt-1 text-sm text-cyan-300">{selectedNode.group.toUpperCase()}</div>
            </div>
            <div className="h-4 w-4 rounded-full" style={{ background: NODE_COLORS[selectedNode.group as keyof typeof NODE_COLORS].core, boxShadow: `0 0 20px ${NODE_COLORS[selectedNode.group as keyof typeof NODE_COLORS].core}` }} />
          </div>
          <div className="mt-8 space-y-5">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">Time Spent</div>
              <div className="mt-1 text-4xl font-bold text-white">{selectedNode.timeSpent}m</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">URL</div>
              <div className="mt-2 break-all text-sm text-white/70">{selectedNode.url}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">Description</div>
              <div className="mt-2 text-sm leading-relaxed text-white/70">{selectedNode.description}</div>
            </div>
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-300">
              Active neural pathway traced
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
