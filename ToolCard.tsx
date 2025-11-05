
import React from 'react';
import type { Tool } from '../types';

interface ToolCardProps {
  tool: Tool;
  onSelect: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className="group bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover:shadow-xl dark:shadow-slate-900/50 transform hover:-translate-y-1 transition-all duration-300 ease-in-out text-left border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500"
    >
      <div className="flex items-center justify-center h-16 w-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg mb-4">
        {tool.icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{tool.title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{tool.description}</p>
    </button>
  );
};

export default ToolCard;
