import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigationStore } from '../../../core/navigation/NavigationStore';
import { SpatialGraph } from '../../../core/graph/SpatialGraph';

interface CameraRigProps {
  graph: SpatialGraph | null;
}

export const CameraRig: React.FC<CameraRigProps> = ({ graph }) => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  
  const level = useNavigationStore(state => state.level);
  const currentNodeId = useNavigationStore(state => state.currentNodeId);
  const isFreeExplore = useRef(false);

  // Targets for lerping
  const targetCameraPos = useRef(new THREE.Vector3(0, 0, 1200));
  const targetControlCenter = useRef(new THREE.Vector3(0, 0, 0));
  const targetFov = useRef(45);

  useEffect(() => {
    // When navigation state changes, we snap out of free explore mode
    isFreeExplore.current = false;
  }, [level, currentNodeId]);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    if (!isFreeExplore.current) {
      if (level === 'overview') {
        targetControlCenter.current.set(0, 0, 0);
        targetCameraPos.current.set(0, 0, 1200);
        targetFov.current = 45;
      } else if (currentNodeId && graph) {
        const node = graph.nodes.find(n => n.id === currentNodeId);
        if (node) {
          targetControlCenter.current.set(node.position.x, node.position.y, node.position.z);
          
          let dist = 1200;
          if (level === 'domain') {
            dist = 600;
            targetFov.current = 40;
          } else if (level === 'district') {
            dist = 400;
            targetFov.current = 35;
          } else if (level === 'place') {
            dist = 220;
            targetFov.current = 28;
          } else if (level === 'trace') {
            dist = 100;
            targetFov.current = 25;
          }

          targetCameraPos.current.set(
            node.position.x,
            node.position.y,
            node.position.z + dist
          );
        }
      }

      // Lerp camera position - slower for cinematic feel
      camera.position.lerp(targetCameraPos.current, 0.02);
      // Lerp controls target - slightly faster to track before camera arrives
      controlsRef.current.target.lerp(targetControlCenter.current, 0.03);
      
      // Lerp FOV
      if ((camera as THREE.PerspectiveCamera).fov !== targetFov.current) {
        (camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp((camera as THREE.PerspectiveCamera).fov, targetFov.current, 0.02);
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      }

      controlsRef.current.update();
    }
    const distToTarget = camera.position.distanceTo(targetCameraPos.current);
    const isTransitioning = !isFreeExplore.current && distToTarget > 1.0;

    (window as any).__DEBUG_CAMERA__ = {
        position: camera.position.clone(),
        fov: (camera as THREE.PerspectiveCamera).fov,
        isTransitioning
    };
  });

  const isOverview = level === 'overview';

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={!isOverview} // Disable free orbit in overview mode, acting like a 2D map
      maxDistance={2500}
      minDistance={20}
      maxPolarAngle={Math.PI / 1.5} // Restrict camera from going completely under the graph
      onStart={() => {
        // If user manually moves the camera, switch to FreeExplore
        isFreeExplore.current = true;
      }}
    />
  );
};
