import React, { useEffect, useState } from 'react';
import { useNavigationStore } from '../../../core/navigation/NavigationStore';
import { useInteractionStore } from '../interactions/InteractionState';

export const DebugOverlay: React.FC = () => {
  const navigation = useNavigationStore();
  const interaction = useInteractionStore();
  
  const [fps, setFps] = useState(0);
  const [stats, setStats] = useState({ 
    visibleAnchors: 0, 
    visibleTraces: 0, 
    renderedEdges: 0, 
    camX: 0, camY: 0, camZ: 0,
    isTransitioning: false
  });
  
  const [clickLog, setClickLog] = useState<any>(null);

  useEffect(() => {
    let frames = 0;
    let lastTime = performance.now();
    
    const interval = setInterval(() => {
      const now = performance.now();
      setFps(Math.round((frames * 1000) / (now - lastTime)));
      frames = 0;
      lastTime = now;
      
      // Read camera, graph state, and click log globally
      const cam = (window as any).__DEBUG_CAMERA__;
      const graphStats = (window as any).__DEBUG_GRAPH_STATS__;
      const clickStats = (window as any).__DEBUG_CLICK_LOG__;
      
      setStats({
        camX: cam ? Math.round(cam.position.x) : 0,
        camY: cam ? Math.round(cam.position.y) : 0,
        camZ: cam ? Math.round(cam.position.z) : 0,
        isTransitioning: cam ? cam.isTransitioning : false,
        visibleAnchors: graphStats ? graphStats.anchors : 0,
        visibleTraces: graphStats ? graphStats.traces : 0,
        renderedEdges: graphStats ? graphStats.edges : 0
      });
      
      if (clickStats) {
         setClickLog({...clickStats});
      }
    }, 500);
    
    const onFrame = () => { frames++; requestAnimationFrame(onFrame); };
    let req = requestAnimationFrame(onFrame);
    
    return () => { clearInterval(interval); cancelAnimationFrame(req); };
  }, []);

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      border: '1px solid #333',
      color: '#0f0',
      padding: '12px',
      fontFamily: 'monospace',
      fontSize: '11px',
      pointerEvents: 'none',
      zIndex: 9999,
      borderRadius: '4px',
      width: '280px',
      lineHeight: '1.5'
    }}>
      <div style={{ borderBottom: '1px solid #333', paddingBottom: '4px', marginBottom: '4px', fontWeight: 'bold' }}>
        SYNAPSE DEBUG HUD
      </div>
      <div>FPS: {fps}</div>
      <div>Nav Level: {navigation.level}</div>
      <div>Hovered ID: {interaction.hoveredNodeId || 'none'}</div>
      <div>Selected ID: {navigation.currentNodeId || 'none'}</div>
      <div style={{ borderBottom: '1px solid #333', paddingBottom: '4px', marginBottom: '4px', marginTop: '4px' }} />
      <div>Cam Pos: [{stats.camX}, {stats.camY}, {stats.camZ}]</div>
      <div>Transitioning: {stats.isTransitioning ? 'YES' : 'NO'}</div>
      <div>Visible Anchors: {stats.visibleAnchors}</div>
      <div>Visible Traces: {stats.visibleTraces}</div>
      <div>Visible Edges: {stats.renderedEdges}</div>

      {clickLog && (
        <>
          <div style={{ borderBottom: '1px solid #333', paddingBottom: '4px', marginBottom: '4px', marginTop: '8px', color: '#ffb' }}>
            LAST CLICK PIPELINE
          </div>
          <div style={{ color: '#ffb' }}>Screen: ({clickLog.x}, {clickLog.y})</div>
          <div style={{ color: '#ffb' }}>Raycast Hits: {clickLog.hits}</div>
          
          {clickLog.hitList && clickLog.hitList.length > 0 && (
            <div style={{ marginLeft: '8px', marginBottom: '4px', color: '#dd9' }}>
              {clickLog.hitList.map((h: any, i: number) => (
                <div key={i}>{i+1}. {h.id} (dist: {h.distance})</div>
              ))}
            </div>
          )}

          <div style={{ color: '#ffb' }}>Top Hit: {clickLog.topHit}</div>
          <div style={{ color: '#ffb' }}>Distance: {clickLog.distance}</div>
          <div style={{ color: '#ffb' }}>Target Node: {clickLog.target}</div>
          <div style={{ color: '#ffb' }}>Selected Node: {clickLog.selectedNode}</div>
          <div style={{ color: '#ffb' }}>Click Accepted: {clickLog.accepted ? 'YES' : 'NO'}</div>
          <div style={{ color: '#ffb' }}>Reason: {clickLog.reason}</div>
          <div style={{ color: '#ffb' }}>Source: {clickLog.source}</div>
        </>
      )}

      <button 
        onClick={() => {
           import('../../../core/debug/SessionRecorder').then(module => {
              module.SessionRecorder.exportSession();
           });
        }}
        style={{
          marginTop: '12px',
          padding: '6px 12px',
          backgroundColor: '#333',
          color: '#fff',
          border: '1px solid #555',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%',
          fontFamily: 'monospace',
          pointerEvents: 'auto'
        }}
      >
        Export Session JSON
      </button>
    </div>
  );
};
