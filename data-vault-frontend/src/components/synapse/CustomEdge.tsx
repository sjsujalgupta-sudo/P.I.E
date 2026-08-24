import React from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath } from '@xyflow/react';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 24,
  });

  return (
    <>
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={selected ? 1 : 0.5} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={selected ? 1 : 0.5} />
        </linearGradient>
      </defs>

      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          stroke: `url(#gradient-${id})`,
          strokeWidth: selected ? 3 : 2,
          filter: selected ? 'drop-shadow(0 0 5px rgba(139,92,246,0.8))' : 'none',
          transition: 'stroke-width 0.3s, filter 0.3s',
        }}
        className="react-flow__edge-path" 
      />

      {/* Animated Data Particle traveling along the path */}
      <circle r="3" fill="#60a5fa" filter="drop-shadow(0 0 4px #60a5fa)">
        <animateMotion dur={`${1.5 + Math.random()}s`} repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
}
