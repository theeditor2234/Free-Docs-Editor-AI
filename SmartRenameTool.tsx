
import React, { useState } from 'react';
import type { Tool } from '../../types';
import FileUploader from '../FileUploader';
import ToolContainer from '../ToolContainer';
import { getSuggestedFileName } from '../../services/geminiService';

interface SmartRenameToolProps {
  tool: Tool;
  onBack: () => void;
}

const SmartRenameTool: React.FC<SmartRenameToolProps> = ({ tool, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [suggestedName, setSuggestedName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFileSelect = async (selectedFile: File | File[]) => {
    const f = selectedFile as File;
    setFile(f);
    setIsLoading(true);
    setSuggestedName('');
    const name = await getSuggestedFileName(f);
    setSuggestedName(name);
    setIsLoading(false);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(suggestedName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolContainer tool={tool} onBack={onBack}>
      {!file ? (
        <FileUploader onFileSelect={handleFileSelect} accept={tool.accept} />
      ) : (
        <div>
          <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
            <img src={URL.createObjectURL(file)} alt="Preview" className="w-32 h-32 object-cover rounded-lg shadow-md" />
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Original Name: {file.name}</p>
              <p className="text-sm text-slate-500">Type: {file.type}</p>
            </div>
          </div>
          
          <div>
            <label htmlFor="suggested-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">AI Suggested Name</label>
            <div className="mt-1 relative">
              <input
                id="suggested-name"
                type="text"
                value={isLoading ? 'Generating...' : suggestedName}
                readOnly={isLoading}
                onChange={(e) => setSuggestedName(e.target.value)}
                className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-20"
              />
              <button
                onClick={handleCopy}
                disabled={!suggestedName || isLoading}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-medium rounded-r-md border border-transparent bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <button onClick={() => setFile(null)} className="w-full mt-8 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-500">
            Use another image
          </button>
        </div>
      )}
    </ToolContainer>
  );
};

export default SmartRenameTool;
