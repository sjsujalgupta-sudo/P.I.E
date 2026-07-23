import React from 'react';
import { useNavigationStore, NavigationNode } from '../../../core/navigation/NavigationStore';
import { NavigationController } from '../../../core/navigation/NavigationController';

export const Breadcrumbs: React.FC = () => {
  const path = useNavigationStore(state => state.path);

  const handleNavigate = (node: NavigationNode, index: number) => {
    // If they click the last item, do nothing
    if (index === path.length - 1) return;

    // Pop path up to the clicked index
    const newPath = path.slice(0, index + 1);
    
    // We update the state directly or use a controller method
    // For now we can just push it to the store
    useNavigationStore.getState().setPath(newPath);
    useNavigationStore.getState().setLevel(node.level);
    useNavigationStore.getState().setCurrentNodeId(node.id === 'root' ? null : node.id);
  };

  return (
    <div className="absolute top-6 left-6 z-20 flex items-center space-x-2 text-sm">
      {path.map((node, index) => {
        const isLast = index === path.length - 1;
        
        return (
          <React.Fragment key={node.id}>
            <button
              onClick={() => handleNavigate(node, index)}
              className={`transition-colors ${
                isLast 
                  ? 'text-white font-semibold cursor-default' 
                  : 'text-gray-500 hover:text-white cursor-pointer'
              }`}
            >
              {node.name.toUpperCase()}
            </button>
            
            {!isLast && (
              <span className="text-gray-700">/</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
