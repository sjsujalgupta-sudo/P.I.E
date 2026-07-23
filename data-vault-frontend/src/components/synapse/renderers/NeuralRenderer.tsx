import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import { SpatialGraph, SpatialNode } from '../../../core/graph/SpatialGraph';
import { LODManager } from './LODManager';
import { useInteractionStore } from '../interactions/InteractionState';
import { useNavigationStore } from '../../../core/navigation/NavigationStore';
import { NavigationController } from '../../../core/navigation/NavigationController';
import { SessionRecorder } from '../../../core/debug/SessionRecorder';

interface NeuralRendererProps {
  graph: SpatialGraph | null;
}

const colorMap: Record<string, THREE.Color> = {
  Programming: new THREE.Color('#3b82f6').multiplyScalar(2),
  AI: new THREE.Color('#8b5cf6').multiplyScalar(2),
  Entertainment: new THREE.Color('#f43f5e').multiplyScalar(2),
  Finance: new THREE.Color('#10b981').multiplyScalar(2),
  Science: new THREE.Color('#06b6d4').multiplyScalar(2),
  default: new THREE.Color('#94a3b8').multiplyScalar(1.5),
};

export const NeuralRenderer: React.FC<NeuralRendererProps> = ({ graph }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const hitMeshRef = useRef<THREE.InstancedMesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // State
  const interaction = useInteractionStore();
  const navigation = useNavigationStore();
  const activeNodeId = navigation.currentNodeId || interaction.hoveredNodeId;
  const activeNode = activeNodeId && graph ? graph.nodes.find(n => n.id === activeNodeId) : null;

  const [revealTime, setRevealTime] = useState(0);
  
  useEffect(() => {
    if (graph) {
      setRevealTime(Date.now());
      NavigationController.setGraph(graph);
    }
  }, [graph]);

  // Compute domain centers for subtle titles
  const domains = useMemo(() => {
    if (!graph) return [];
    const clusterMap = new Map<string, { sum: THREE.Vector3, count: number }>();
    for (const node of graph.nodes) {
      const group = node.group || 'default';
      if (!clusterMap.has(group)) {
        clusterMap.set(group, { sum: new THREE.Vector3(), count: 0 });
      }
      const data = clusterMap.get(group)!;
      data.sum.x += node.position.x;
      data.sum.y += node.position.y;
      data.sum.z += node.position.z;
      data.count++;
    }
    const result = [];
    for (const [group, data] of clusterMap.entries()) {
      if (group === 'default') continue;
      result.push({
        group,
        center: data.sum.divideScalar(data.count),
        color: colorMap[group] || colorMap.default,
      });
    }
    return result;
  }, [graph]);

  // Main Render Update
  useFrame(() => {
    if (!graph || !meshRef.current) return;
    
    // Process LOD & Visibility
    const processedGraph = LODManager.updateLOD(graph, navigation, interaction);
    const { nodes, edges } = processedGraph;
    
    // Resize instance buffers if needed
    if (meshRef.current.count < nodes.length) {
       meshRef.current.count = nodes.length;
       if (hitMeshRef.current) hitMeshRef.current.count = nodes.length;
    }

    const now = Date.now();
    const timeSinceReveal = now - revealTime;
    
    let visibleAnchors = 0;
    let visibleTraces = 0;
    let renderedEdges = 0;

    // Nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      
      let revealOpacity = 1.0;
      if (timeSinceReveal < 1200) {
        let delay = 0;
        if (node.nodeClass === 'Landmark' || node.nodeClass === 'Hub') delay = 500;
        else delay = 800;

        if (timeSinceReveal < delay) revealOpacity = 0;
        else revealOpacity = Math.min(1, (timeSinceReveal - delay) / 300);
      }

      // Get current state of the instance
      meshRef.current.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
      
      const isSelected = node.id === navigation.currentNodeId;
      const isNeighbor = false; // We can compute neighbors if needed, but let's stick to cluster for now
      const isSameCluster = activeNode && node.group === activeNode.group;
      const isHovered = node.id === interaction.hoveredNodeId;

      // Target scale from LOD + visualRadius
      let targetScale = 0;
      if (node.lodLevel > 0) {
        targetScale = node.visualRadius;
        if (node.nodeClass === 'Landmark' || node.nodeClass === 'Hub') {
          targetScale *= 4; // Boost for Overview visibility
        }
      }
      
      if (isSelected) {
        targetScale *= 1.2; // +20% scale for selected
        const pulseScale = (Math.sin(now * 0.003) + 1) * 0.05; // slow pulse
        targetScale += pulseScale;
      } else if (isHovered) {
        targetScale *= 1.1;
      }
      
      // Smooth scale
      const currentScale = dummy.scale.x + (targetScale - dummy.scale.x) * 0.15;
      
      // Smooth position
      dummy.position.lerp(new THREE.Vector3(node.position.x, node.position.y, node.position.z), 0.1);
      
      dummy.scale.set(currentScale, currentScale, currentScale);
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(i, dummy.matrix);
      
      // Selection Hit Area (Only active if visible)
      const hitScale = node.lodLevel === 0 ? 0 : targetScale * 1.5;
      dummy.scale.setScalar(hitScale);
      dummy.updateMatrix();
      if (hitMeshRef.current) hitMeshRef.current.setMatrixAt(i, dummy.matrix);

      const baseColor = colorMap[node.group || 'default'] || colorMap.default;
      const finalColor = baseColor.clone();
      
      let targetOpacity = node.opacity * revealOpacity;

      if (activeNodeId) {
        if (isSelected) {
          const pulse = (Math.sin(now * 0.005) + 1) * 0.5;
          finalColor.lerp(new THREE.Color('#ffffff'), 0.8 + pulse * 0.2); // White core
          targetOpacity = 1.0;
        } else if (isHovered) {
          finalColor.lerp(new THREE.Color('#ffffff'), 0.4);
          targetOpacity = 0.9;
        } else if (isSameCluster) {
          targetOpacity *= 0.6; // slightly dimmer, just color
        } else {
          targetOpacity *= 0.15; // unrelated faded to tiny dots
        }
      } else {
         // No selection state, lower base opacity to increase contrast when things are selected
         targetOpacity *= 0.7; 
      }

      finalColor.multiplyScalar(targetOpacity);
      meshRef.current.setColorAt(i, finalColor);
      
      if (targetOpacity > 0.05) {
        if (node.nodeClass === 'Landmark' || node.nodeClass === 'Hub') visibleAnchors++;
        else visibleTraces++;
      }
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    
    if (hitMeshRef.current) {
      hitMeshRef.current.instanceMatrix.needsUpdate = true;
      // Prevent raycaster from missing instances because the global bounding sphere hasn't updated
      if (!hitMeshRef.current.boundingSphere) {
        hitMeshRef.current.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100000);
      }
    }
    
    if (!meshRef.current.boundingSphere) {
      meshRef.current.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100000);
    }

    // Edges
    if (linesRef.current) {
      const positions = new Float32Array(edges.length * 6);
      const colors = new Float32Array(edges.length * 6);
      
      const nodeMap = new Map<string, SpatialNode>();
      for (const n of nodes) nodeMap.set(n.id, n);

      let edgeIdx = 0;
      for (const edge of edges) {
        if (!edge.isVisible) continue;

        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);

        if (sourceNode && targetNode) {
          positions[edgeIdx * 6] = sourceNode.position.x;
          positions[edgeIdx * 6 + 1] = sourceNode.position.y;
          positions[edgeIdx * 6 + 2] = sourceNode.position.z;
          
          positions[edgeIdx * 6 + 3] = targetNode.position.x;
          positions[edgeIdx * 6 + 4] = targetNode.position.y;
          positions[edgeIdx * 6 + 5] = targetNode.position.z;

          let edgeReveal = 1.0;
          if (timeSinceReveal < 1200) {
             if (timeSinceReveal < 1000) edgeReveal = 0;
             else edgeReveal = Math.min(1, (timeSinceReveal - 1000) / 200);
          }

          const isSourceActive = activeNodeId && sourceNode.id === activeNodeId;
          const isTargetActive = activeNodeId && targetNode.id === activeNodeId;
          const isConnectedToActive = isSourceActive || isTargetActive;
          
          let edgeOpacity = Math.min(sourceNode.opacity, targetNode.opacity) * edge.opacity * edgeReveal;
          let edgeColor = new THREE.Color('#334155');

          if (activeNodeId) {
            if (isConnectedToActive) {
               edgeOpacity = Math.min(1.0, edgeOpacity * 3);
               edgeColor = new THREE.Color('#94a3b8');
            } else if (sourceNode.group === activeNode?.group && targetNode.group === activeNode?.group) {
               edgeOpacity *= 0.5; // Same cluster, slightly dimmer
            } else {
               edgeOpacity *= 0.1; // Unrelated edges fade out completely
            }
          }

          // Subtler edges
          const finalEdgeColor = edgeColor.clone().multiplyScalar(edgeOpacity + 0.1);
          
          if (edgeOpacity > 0.01) renderedEdges++;
          
          colors[edgeIdx * 6] = finalEdgeColor.r;
          colors[edgeIdx * 6 + 1] = finalEdgeColor.g;
          colors[edgeIdx * 6 + 2] = finalEdgeColor.b;
          colors[edgeIdx * 6 + 3] = finalEdgeColor.r;
          colors[edgeIdx * 6 + 4] = finalEdgeColor.g;
          colors[edgeIdx * 6 + 5] = finalEdgeColor.b;
          
          edgeIdx++;
        }
      }

      linesRef.current.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions.slice(0, edgeIdx * 6), 3));
      linesRef.current.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors.slice(0, edgeIdx * 6), 3));
      linesRef.current.geometry.computeBoundingSphere();
    }
    
    (window as any).__DEBUG_GRAPH_STATS__ = {
      anchors: visibleAnchors,
      traces: visibleTraces,
      edges: renderedEdges
    };
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!graph || e.instanceId === undefined) return;
    const node = graph.nodes[e.instanceId];
    if (node) {
      interaction.setHoveredNode(node.id);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    interaction.setHoveredNode(undefined);
    document.body.style.cursor = 'default';
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    SessionRecorder.log('pointerdown', { x: e.clientX, y: e.clientY, hits: e.intersections.length });
  };
  
  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    SessionRecorder.log('pointerup', { x: e.clientX, y: e.clientY, hits: e.intersections.length });
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    
    SessionRecorder.log('click_raw', { x: e.clientX, y: e.clientY, hits: e.intersections.length });
    
    const clickLog: any = {
      x: e.clientX,
      y: e.clientY,
      hits: e.intersections.length,
      hitList: [],
      topHit: 'none',
      distance: 0,
      target: 'none',
      selectedNode: navigation.currentNodeId || 'none',
      accepted: false,
      reason: '',
      source: ''
    };

    if (e.intersections.length > 0) {
      // Record top 5 hits
      clickLog.hitList = e.intersections.slice(0, 5).map(hit => {
         const node = hit.instanceId !== undefined && graph ? graph.nodes[hit.instanceId] : null;
         return {
            id: node ? node.id : 'unknown',
            distance: Math.round(hit.distance)
         };
      });
    }

    let hitInstanceId = e.instanceId;
    
    if (e.intersections.length > 0 && graph) {
      // Find the first hit that is NOT the currently selected node
      const currentSelected = navigation.currentNodeId;
      const validHit = e.intersections.find(hit => {
         const n = hit.instanceId !== undefined ? graph!.nodes[hit.instanceId] : null;
         return n && n.id !== currentSelected;
      });
      
      const chosenHit = validHit || e.intersections[0];
      hitInstanceId = chosenHit.instanceId;
      
      const topNode = hitInstanceId !== undefined ? graph.nodes[hitInstanceId] : null;
      if (topNode) {
        clickLog.topHit = topNode.id;
        clickLog.distance = Math.round(chosenHit.distance);
      }
    }

    if (!graph || hitInstanceId === undefined) {
      clickLog.reason = 'No instanceId on hit';
      clickLog.source = 'NeuralRenderer.tsx: handleClick';
      (window as any).__DEBUG_CLICK_LOG__ = clickLog;
      SessionRecorder.log('click_rejected', clickLog);
      return;
    }
    
    const node = graph.nodes[hitInstanceId];
    if (node) {
      clickLog.target = node.id;
      
      const camDebug = (window as any).__DEBUG_CAMERA__;
      if (camDebug && camDebug.isTransitioning) {
        clickLog.reason = 'Camera is transitioning';
        clickLog.accepted = false;
        clickLog.source = 'NeuralRenderer.tsx: Camera check';
      } else if (navigation.currentNodeId === node.id) {
        clickLog.reason = 'Already selected';
        clickLog.accepted = false;
        clickLog.source = 'NeuralRenderer.tsx: Selection check';
      } else {
        clickLog.reason = 'Success';
        clickLog.accepted = true;
        clickLog.source = 'NavigationController.transitionTo';
        SessionRecorder.log('click_accepted', clickLog);
        NavigationController.transitionTo(node.id);
        (window as any).__DEBUG_CLICK_LOG__ = clickLog;
        return; // TransitionTo handles its own logging
      }
    } else {
      clickLog.reason = 'Node not found in graph';
      clickLog.source = 'NeuralRenderer.tsx: node lookup';
    }
    
    SessionRecorder.log('click_rejected', clickLog);
    (window as any).__DEBUG_CLICK_LOG__ = clickLog;
  };

  const handleBackgroundClick = () => {
    SessionRecorder.log('background_click', {});
    interaction.clearInteraction();
    NavigationController.transitionToOverview();
  };

  const isOverview = navigation.level === 'overview';

  // Ambient Particles
  const particles = useMemo(() => {
    const count = 100;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4000;
    }
    return positions;
  }, []);

  const particlesRef = useRef<THREE.Points>(null);

  useFrame(() => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.00005;
      particlesRef.current.rotation.x += 0.00002;
    }
  });

  return (
    <group onPointerMissed={handleBackgroundClick}>
      {/* Scene Lighting for PBR materials */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 20, 15]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-10, -20, -15]} intensity={0.5} color="#4466ff" />
      
      {/* Ambient Dust */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles, 3]}
          />
        </bufferGeometry>
        <pointsMaterial size={2} color="#ffffff" transparent opacity={0.03} sizeAttenuation={true} depthWrite={false} toneMapped={false} />
      </points>

      {/* Subtle Domain Identifiers */}
      {domains.map((domain) => (
        <group key={`domain-${domain.group}`} position={domain.center}>
          {isOverview && (
            <Text
              position={[0, 40, 0]} // Float slightly above the domain center
              fontSize={14}
              color={domain.color}
              fillOpacity={0.8}
              anchorX="center"
              anchorY="middle"
            >
              {domain.group}
            </Text>
          )}
        </group>
      ))}

      {/* Visible Nodes */}
      {graph && graph.nodes.length > 0 && (
        <instancedMesh 
          ref={meshRef} 
          args={[undefined, undefined, graph.nodes.length]}
          frustumCulled={false}
          raycast={() => null}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            color="#ffffff" 
            emissive="#000000"
            roughness={0.7}
            metalness={0.2}
          />
        </instancedMesh>
      )}

      {/* Invisible Hit Mesh (24px scale) */}
      {graph && graph.nodes.length > 0 && (
        <instancedMesh 
          ref={hitMeshRef} 
          args={[undefined, undefined, graph.nodes.length]}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onClick={handleClick}
          frustumCulled={false}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial 
            transparent 
            opacity={0} 
            depthWrite={false} 
          />
        </instancedMesh>
      )}

      {/* Edges */}
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial 
          vertexColors 
          transparent 
          opacity={0.5} 
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Animated Orbital Ring for Selected Node */}
      {activeNode && navigation.currentNodeId === activeNode.id && (
        <group position={[activeNode.position.x, activeNode.position.y, activeNode.position.z]}>
           <mesh ref={(mesh) => {
              if (mesh) {
                 const now = Date.now();
                 mesh.rotation.x = now * 0.001;
                 mesh.rotation.y = now * 0.0015;
              }
           }}>
              <torusGeometry args={[activeNode.visualRadius * (activeNode.nodeClass === 'Landmark' || activeNode.nodeClass === 'Hub' ? 4 : 1) * 1.5, 0.2, 16, 64]} />
              <meshBasicMaterial color={colorMap[activeNode.group || 'default'] || colorMap.default} transparent opacity={0.8} side={THREE.DoubleSide} />
           </mesh>
        </group>
      )}

      {/* Hybrid Labels (Html for active) */}
      {activeNode && (
        <Html 
          position={[
             activeNode.position.x, 
             activeNode.position.y + (activeNode.visualRadius * (activeNode.nodeClass === 'Landmark' || activeNode.nodeClass === 'Hub' ? 4 : 1) + 35), 
             activeNode.position.z
          ]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className="px-4 py-2 bg-black/90 backdrop-blur-md text-white rounded-lg border border-white/20 whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
            <div className="font-extrabold text-white tracking-wide text-[115%]">{activeNode.title || 'Unknown Memory'}</div>
            <div className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-widest">{activeNode.group}</div>
          </div>
        </Html>
      )}
    </group>
  );
};
