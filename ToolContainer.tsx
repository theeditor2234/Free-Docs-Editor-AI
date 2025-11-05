
import React from 'react';
import type { Tool } from '../types';

interface ToolContainerProps {
  tool: Tool;
  onBack: () => void;
  children: React.ReactNode;
}

const ToolContainer: React.FC<ToolContainerProps> = ({ tool, onBack, children }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to all tools
        </button>
        <div className="flex items-center mt-4">
            <div className="flex items-center justify-center h-16 w-16 bg-indigo-100 dark:bg-slate-800 rounded-lg mr-4">
                {tool.icon}
            </div>
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{tool.title}</h2>
                <p className="text-slate-500 dark:text-slate-400">{tool.description}</p>
            </div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        {children}
      </div>
    </div>
  );
};

export default ToolContainer;
