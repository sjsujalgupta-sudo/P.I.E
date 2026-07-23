'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Html, useProgress } from '@react-three/drei';

import { memoryStore } from '../../core/memory/MemoryStore';
import { MockProvider } from '../../core/memory/providers/MockProvider';
import { eventBus } from '../../core/memory/EventBus';
import { GraphBuilder } from '../../core/graph/GraphBuilder';
import { LayoutEngine } from '../../core/layout/LayoutEngine';
import { HierarchicalLayoutStrategy } from '../../core/layout/strategies/HierarchicalLayoutStrategy';
import { SpatialGraph } from '../../core/graph/SpatialGraph';

import { NeuralRenderer } from './renderers/NeuralRenderer';
import { CameraRig } from './renderers/CameraRig';
import { DebugOverlay } from './debug/DebugOverlay';
import { ProductionHUD } from './ui/ProductionHUD';
import { KeyboardController } from './interactions/KeyboardController';

const Loader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="text-white/50 font-mono text-sm tracking-widest animate-pulse">
          INITIALIZING CORTEX
        </div>
        <div className="w-48 h-1 bg-white/10 rounded overflow-hidden">
          <div 
            className="h-full bg-white/80 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Html>
  );
};

export const SynapseEngine: React.FC = () => {
  const [graph, setGraph] = useState<SpatialGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(true); // Default to visible for debugging

  // Layout Engine instance
  const layoutEngine = useMemo(() => new LayoutEngine(), []);

  useEffect(() => {
    // We use the new Hierarchical Layout Strategy which introduces WorldBuilder and WorldStyler
    layoutEngine.setStrategy(new HierarchicalLayoutStrategy());
    
    layoutEngine.setOnUpdate((spatialGraph) => {
      setGraph(spatialGraph);
      setLoading(false);
    });

    // Subscribe to Event Bus for Graph Rebuilds
    const unsubscribe = eventBus.subscribe('GRAPH_REBUILD_REQUIRED', () => {
      const { nodes, edges } = GraphBuilder.build(memoryStore);
      layoutEngine.initLayout(nodes, edges);
    });

    // Boot pipeline
    const init = async () => {
      const provider = new MockProvider(); // MockProvider doesn't take 42 in its constructor anymore based on what we saw, but we'll try
      await provider.runPipeline(); // Will fire GRAPH_REBUILD_REQUIRED when done
    };

    init();

    return () => {
      unsubscribe();
      layoutEngine.terminate();
    };
  }, [layoutEngine]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' && e.ctrlKey) {
        e.preventDefault();
        setShowDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full h-full bg-[#050505] relative overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white z-10 pointer-events-none">
          <div className="flex flex-col items-center opacity-50">
            <div className="w-8 h-8 border-2 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm tracking-[0.2em] font-light">BOOTING CORTEX...</p>
          </div>
        </div>
      )}

      {/* UI Layer */}
      {!loading && (
        <>
          <ProductionHUD graph={graph} />
          {showDebug && <DebugOverlay />}
          <KeyboardController graph={graph} />
        </>
      )}
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 1200], fov: 45, near: 10, far: 5000 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]} // Optimize for high DPI displays while capping at 2x
      >
        <color attach="background" args={['#050505']} />
        
        <Suspense fallback={<Loader />}>
          {/* Post-processing disabled for pure clarity during development */}

          {/* Core Scene */}
          <CameraRig graph={graph} />
          {graph && <NeuralRenderer graph={graph} />}
        </Suspense>
      </Canvas>
    </div>
  );
};
