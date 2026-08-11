'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Share, Settings, Plus, Copy, BarChart2, MoreVertical, Maximize2, X, Layers } from 'lucide-react';
import * as d3 from 'd3-force';

import { memoryStore } from '../../core/memory/MemoryStore';
import { APIProvider } from '../../core/memory/providers/APIProvider';
import { eventBus } from '../../core/memory/EventBus';
import { MindmapNode } from './MindmapNode';
import { CustomEdge } from './CustomEdge';

const nodeTypes = {
  mindmap: MindmapNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// Global provider instance
const apiProvider = new APIProvider();

// Hook for Force Directed Layout
function useForceLayout(initialNodes: Node[], initialEdges: Edge[]) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (initialNodes.length === 0) return;

    // We only want to calculate positions once and then let React Flow handle the rest
    const simulationNodes = initialNodes.map((n) => ({
      ...n,
      x: n.position.x || Math.random() * 500 - 250,
      y: n.position.y || Math.random() * 500 - 250,
    }));
    
    const simulationEdges = initialEdges.map((e) => ({
      ...e,
      source: e.source,
      target: e.target,
    }));

    // Calculate depths for horizontal layout
    const depthMap = new Map<string, number>();
    depthMap.set('vault-root', 0); // Root is 0
    
    // Simple BFS to assign depths
    let changed = true;
    while(changed) {
      changed = false;
      simulationEdges.forEach(edge => {
        const sourceDepth = depthMap.get(edge.source);
        if (sourceDepth !== undefined) {
          const currentTargetDepth = depthMap.get(edge.target);
          if (currentTargetDepth === undefined || currentTargetDepth > sourceDepth + 1) {
            depthMap.set(edge.target, sourceDepth + 1);
            changed = true;
          }
        }
      });
    }

    // Assign node positions and depths
    simulationNodes.forEach(n => {
      const depth = depthMap.get(n.id) ?? 2; // Default to depth 2 if unconnected
      (n as any).depth = depth;
      
      // Pin root to far left
      if (n.id === 'vault-root') {
        (n as any).fx = 0;
        (n as any).fy = 0;
      }
    });

    const simulation = d3.forceSimulation(simulationNodes as any)
      .force('charge', d3.forceManyBody().strength(-1500).distanceMax(1000))
      .force('link', d3.forceLink(simulationEdges as any).id((d: any) => d.id).distance(200))
      .force('collide', d3.forceCollide().radius(80).iterations(3))
      // Pull nodes to the right based on their depth
      .force('x', d3.forceX((d: any) => d.depth * 350).strength(0.8))
      // Keep nodes somewhat vertically centered so it doesn't drift away
      .force('y', d3.forceY(0).strength(0.1));

    // Run simulation synchronously for a few ticks to get a good initial layout
    simulation.tick(200);
    simulation.stop();

    const layedOutNodes = simulationNodes.map((n: any) => {
      // Return normal React Flow Node
      return {
        ...n,
        position: { x: n.x, y: n.y },
        // Add buttery smooth spring-like CSS transition for layout updates
        className: 'transition-transform duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        // Clear fixed positions so user can drag them freely later
        fx: undefined,
        fy: undefined,
      };
    });

    setNodes(layedOutNodes);
    setEdges(initialEdges);
    setIsReady(true);

  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return { nodes, edges, onNodesChange, onEdgesChange, isReady, setEdges };
}

export function NotebookMindmap() {
  const [rawNodes, setRawNodes] = useState<Node[]>([]);
  const [rawEdges, setRawEdges] = useState<Edge[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const { visibleNodes, visibleEdges } = useMemo(() => {
    if (collapsedNodes.size === 0) return { visibleNodes: rawNodes, visibleEdges: rawEdges };

    const visibleNodeIds = new Set<string>();
    const queue = ['vault-root'];
    visibleNodeIds.add('vault-root');

    const adj = new Map<string, string[]>();
    rawEdges.forEach(e => {
      if (!adj.has(e.source)) adj.set(e.source, []);
      adj.get(e.source)!.push(e.target);
    });

    // Find any nodes with 0 in-degree to act as additional roots (in case they exist)
    const hasIncoming = new Set<string>();
    rawEdges.forEach(e => hasIncoming.add(e.target));
    rawNodes.forEach(n => {
      if (!hasIncoming.has(n.id) && !visibleNodeIds.has(n.id)) {
        visibleNodeIds.add(n.id);
        queue.push(n.id);
      }
    });

    let qIdx = 0;
    while(qIdx < queue.length) {
      const currentId = queue[qIdx++];
      if (!collapsedNodes.has(currentId)) {
        const children = adj.get(currentId) || [];
        for (const childId of children) {
          if (!visibleNodeIds.has(childId)) {
            visibleNodeIds.add(childId);
            queue.push(childId);
          }
        }
      }
    }

    const vNodes = rawNodes.filter(n => visibleNodeIds.has(n.id));
    const vEdges = rawEdges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
    return { visibleNodes: vNodes, visibleEdges: vEdges };
  }, [rawNodes, rawEdges, collapsedNodes]);

  const { nodes, edges, onNodesChange, onEdgesChange, isReady, setEdges } = useForceLayout(visibleNodes, visibleEdges);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  }, []);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  useEffect(() => {
    const buildGraph = () => {
      const traces = memoryStore.getAllTraces();
      const relations = memoryStore.getAllRelations();

      // Create a Central Root Node to tie all domains together radially
      const rootNodeId = 'vault-root';
      const initialNodes: Node[] = [
        {
          id: rootNodeId,
          type: 'mindmap',
          data: { label: 'My Vault', type: 'project', importance: 1.0 },
          position: { x: 0, y: 0 },
        }
      ];

      const initialEdges: Edge[] = [];

      traces.forEach(trace => {
        const metadata = memoryStore.getMetadata(trace.id);
        const importance = metadata?.importance || 0.5;
        
        initialNodes.push({
          id: trace.id,
          type: 'mindmap',
          data: {
            label: trace.title,
            type: trace.type,
            importance: importance,
          },
          position: { x: 0, y: 0 },
        });

        // If it's a domain (importance 1.0 from MockProvider), link to Root
        if (importance === 1.0) {
          initialEdges.push({
            id: `e-root-${trace.id}`,
            source: rootNodeId,
            target: trace.id,
            type: 'custom',
            animated: true,
          });
        }
      });

      relations.forEach((rel, index) => {
        initialEdges.push({
          id: `e-${rel.sourceId}-${rel.targetId}-${index}`,
          source: rel.sourceId, // Note: In Mindmaps, relations often go Root -> Branch, so target is child. 
          target: rel.targetId,
          type: 'custom',
          animated: true,
        });
      });

      setRawNodes(initialNodes);
      setRawEdges(initialEdges);
      setLoadingData(false);
    };

    const unsubscribe = eventBus.subscribe('GRAPH_REBUILD_REQUIRED', () => {
      buildGraph();
    });

    const init = async () => {
      await apiProvider.runPipeline();
    };

    init();

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col w-full h-screen bg-[#0b0c10] text-gray-200 font-sans selection:bg-fuchsia-500/30">
      
      {/* Top Header matching NotebookLM but slightly sleeker */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#12141a]/80 backdrop-blur-md z-10 relative">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.3)]">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">
            Synapse Mindmap
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/20 rounded-full transition-all text-sm font-medium">
            <Plus size={16} />
            New Node
          </button>
          
          <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-full transition-colors text-sm text-gray-400 hover:text-gray-200">
            <Copy size={16} />
            Copy
          </button>
          
          <button 
            onClick={() => apiProvider.runPipeline()}
            className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-full transition-colors text-sm text-gray-400 hover:text-fuchsia-300"
          >
            <BarChart2 size={16} />
            Sync Live Data
          </button>
          
          <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-full transition-colors text-sm text-gray-400 hover:text-gray-200">
            <Share size={16} />
            Share
          </button>
          
          <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-full transition-colors text-sm text-gray-400 hover:text-gray-200">
            <Settings size={16} />
            Settings
          </button>
          
          <div className="h-6 w-px bg-white/10 mx-2" />
          
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-medium shadow-lg">
            S
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative p-6 bg-[#0b0c10]">
        
        {/* Modal-like Container for the Canvas */}
        <div className="w-full h-full bg-[#161922] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden flex flex-col relative">
          
          {/* React Flow Canvas */}
          <div className="flex-1 relative">
            {loadingData || !isReady ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#161922] z-50">
                <div className="w-10 h-10 border-2 border-t-fuchsia-500 border-r-fuchsia-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
                <span className="text-sm text-fuchsia-400/80 font-medium tracking-widest uppercase">Calculating Radial Physics...</span>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.5, duration: 1000 }}
                minZoom={0.05}
                maxZoom={2}
                className="bg-[#161922]"
                proOptions={{ hideAttribution: true }} // Optional: hides the xyflow attribution if desired
              >
                <Background 
                  variant={BackgroundVariant.Dots} 
                  gap={32} 
                  size={2} 
                  color="#ffffff08" 
                />
                <Controls 
                  className="bg-[#212635] border-none shadow-2xl rounded-xl overflow-hidden [&>button]:bg-transparent [&>button]:border-white/5 [&>button]:text-gray-400 hover:[&>button]:text-white hover:[&>button]:bg-white/10" 
                  showInteractive={false}
                />
              </ReactFlow>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
