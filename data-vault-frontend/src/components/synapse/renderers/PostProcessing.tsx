import React from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

export const PostProcessing: React.FC = () => {
  return (
    <EffectComposer>
      <Bloom 
        luminanceThreshold={0.4} 
        mipmapBlur 
        intensity={0.6} 
      />
    </EffectComposer>
  );
};
