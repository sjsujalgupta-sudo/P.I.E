import React from 'react';
import { useNavigationStore } from '../../../core/navigation/NavigationStore';
import { SpatialGraph } from '../../../core/graph/SpatialGraph';

interface ProductionHUDProps {
  graph: SpatialGraph | null;
}

export const ProductionHUD: React.FC<ProductionHUDProps> = ({ graph }) => {
  const path = useNavigationStore(state => state.path);
  const currentNodeId = useNavigationStore(state => state.currentNodeId);
  const activeNode = currentNodeId && graph ? graph.nodes.find(n => n.id === currentNodeId) : null;
  
  const connectedEdges = activeNode && graph ? graph.edges.filter(e => e.source === activeNode.id || e.target === activeNode.id).length : 0;
  
  // Count children (things in same cluster if it's a domain)
  let childCount = 0;
  if (activeNode && graph && activeNode.nodeClass === 'Landmark') {
    childCount = graph.nodes.filter(n => n.group === activeNode.group && n.id !== activeNode.id).length;
  }

  return (
    <div className="absolute top-8 left-8 z-20 pointer-events-none flex flex-col items-start font-mono text-white select-none">
      <div className="flex flex-col space-y-1 mb-8">
        {path.length === 0 ? (
           <div className="text-xl font-bold tracking-widest text-white/90">WORLD</div>
        ) : (
           path.map((node, index) => {
             const isLast = index === path.length - 1;
             const indent = index * 12; // pixels
             return (
               <div key={`hud-path-${node.id}`} className="flex items-center" style={{ marginLeft: `${indent}px` }}>
                 {index > 0 && <span className="text-white/40 mr-2 text-xs">└</span>}
                 <span className={`tracking-wide ${isLast ? 'text-lg font-bold text-white/100' : 'text-sm font-semibold text-white/60'}`}>
                   {node.name.toUpperCase()}
                 </span>
               </div>
             );
           })
        )}
      </div>

      {activeNode && (
        <div className="flex flex-col space-y-1 text-xs text-white/50 tracking-wider">
          {childCount > 0 && <div>{childCount} RELATED TOPICS</div>}
          {connectedEdges > 0 && <div>{connectedEdges} CONNECTIONS</div>}
          {!childCount && !connectedEdges && <div>ISOLATED MEMORY</div>}
        </div>
      )}
      
      {!activeNode && (
         <div className="text-xs text-white/40 tracking-widest">
           AWAITING SELECTION
         </div>
      )}
    </div>
  );
};
