import React from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Layers, Box, Cpu, Bug, Target, Book, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

type MindmapNodeData = {
  label: string;
  type: string;
  importance: number;
  isDomain?: boolean;
};

type MindmapNodeType = Node<MindmapNodeData, 'mindmap'>;

const getIcon = (type: string, importance: number) => {
  if (importance === 1.0) return <Target size={18} className="text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]" />;
  if (importance >= 0.9) return <Layers size={16} className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />;
  
  switch (type.toLowerCase()) {
    case 'epic': return <Target size={16} className="text-purple-400" />;
    case 'story': return <Book size={16} className="text-emerald-400" />;
    case 'task': return <Box size={16} className="text-blue-400" />;
    case 'sub-task': return <LayoutDashboard size={16} className="text-blue-300" />;
    case 'bug': return <Bug size={16} className="text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]" />;
    default: return <Cpu size={16} className="text-gray-300" />;
  }
};

export function MindmapNode({ data }: NodeProps<MindmapNodeType>) {
  const isRoot = data.importance === 1.0;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative group flex items-center gap-3 px-5 py-2.5 rounded-full cursor-pointer transition-colors duration-300 ${
        isRoot 
          ? 'bg-gradient-to-br from-fuchsia-900/60 to-purple-900/60 border border-fuchsia-400/50 shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_40px_rgba(217,70,239,0.6)] hover:border-fuchsia-300' 
          : 'bg-[#1a1f2c]/90 backdrop-blur-xl border border-[#4c566a] shadow-lg hover:border-blue-400/70 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]'
      }`}
    >
      {/* Target Handle for inward edges from parent */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="opacity-0 w-2 h-2" 
      />
      
      <div className={`flex items-center justify-center p-2 rounded-full ${isRoot ? 'bg-fuchsia-500/20' : 'bg-white/5'}`}>
        {getIcon(data.type, data.importance)}
      </div>
      
      <div className="flex flex-col pr-2">
        <span className={`font-semibold tracking-wide ${isRoot ? 'text-fuchsia-50 text-base' : 'text-gray-200 text-sm'}`}>
          {data.label}
        </span>
      </div>

      {/* Source Handle for outward edges to children */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="opacity-0 w-2 h-2" 
      />
    </motion.div>
  );
}
