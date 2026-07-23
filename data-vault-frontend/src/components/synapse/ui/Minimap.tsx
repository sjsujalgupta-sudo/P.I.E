import React from 'react';
import { useNavigationStore } from '../../../core/navigation/NavigationStore';

export const Minimap: React.FC = () => {
  const level = useNavigationStore(state => state.level);
  
  // Hardcoded for V1 to match the deterministic cluster anchors layout
  const categories = [
    { name: 'AI', x: '50%', y: '10%' },
    { name: 'Programming', x: '20%', y: '20%' },
    { name: 'Entertainment', x: '80%', y: '30%' },
    { name: 'Art', x: '30%', y: '50%' },
    { name: 'Finance', x: '20%', y: '80%' },
    { name: 'Science', x: '80%', y: '80%' },
    { name: 'Travel', x: '60%', y: '90%' },
  ];

  return (
    <div className="absolute bottom-6 right-6 w-48 h-48 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-4 pointer-events-none">
      <div className="text-xs text-white/50 mb-2 font-semibold tracking-wider">CORTEX OVERVIEW</div>
      <div className="relative w-full h-full">
        {categories.map(cat => (
          <div 
            key={cat.name}
            className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
            style={{ left: cat.x, top: cat.y }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
            <div className="absolute top-2 text-[8px] text-white/40 whitespace-nowrap">
              {cat.name}
            </div>
          </div>
        ))}

        {/* Viewport indicator - just a visual element for now */}
        <div className={`absolute border border-white/30 rounded transition-all duration-700 ease-in-out
          ${level === 'overview' ? 'inset-[-10%]' : 'left-1/2 top-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2'}`}
        />
      </div>
    </div>
  );
};
