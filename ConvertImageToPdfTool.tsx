
import React, { useState } from 'react';
import type { Tool } from '../../types';
import FileUploader from '../FileUploader';
import ToolContainer from '../ToolContainer';

interface ConvertImageToPdfToolProps {
  tool: Tool;
  onBack: () => void;
}

const ConvertImageToPdfTool: React.FC<ConvertImageToPdfToolProps> = ({ tool, onBack }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (selectedFiles: File | File[]) => {
    setFiles(prevFiles => [...prevFiles, ...(Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles])]);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsLoading(true);

    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const promise = new Promise<void>((resolve) => {
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const imgWidth = img.width;
            const imgHeight = img.height;
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

            const w = imgWidth * ratio;
            const h = imgHeight * ratio;

            if (i > 0) doc.addPage();
            doc.addImage(img.src, file.type.split('/')[1].toUpperCase(), (pdfWidth-w)/2, (pdfHeight-h)/2, w, h);
            resolve();
          };
          img.src = e.target?.result as string;
        };
      });
      reader.readAsDataURL(file);
      await promise;
    }
    
    doc.save('converted-images.pdf');
    setIsLoading(false);
  };
  
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const resetFiles = () => {
    setFiles([]);
  };

  return (
    <ToolContainer tool={tool} onBack={onBack}>
      {files.length === 0 ? (
        <FileUploader onFileSelect={handleFileSelect} accept={tool.accept} multiple />
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-center">Selected Images ({files.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 max-h-64 overflow-y-auto p-2 bg-slate-100 dark:bg-slate-900 rounded">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-24 object-cover rounded" />
                <button onClick={() => removeFile(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  ✕
                </button>
              </div>
            ))}
          </div>
          
           <FileUploader onFileSelect={handleFileSelect} accept={tool.accept} multiple />
          
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button onClick={handleConvert} className="flex-1 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300" disabled={isLoading}>
              {isLoading ? 'Converting...' : 'Convert to PDF'}
            </button>
            <button onClick={resetFiles} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
              Clear All
            </button>
          </div>
        </div>
      )}
    </ToolContainer>
  );
};

export default ConvertImageToPdfTool;
