import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Tool } from '../../types';
import ToolContainer from '../ToolContainer';
import { getCompressionExplanation } from '../../services/geminiService';

// --- Helper Functions & Types ---

interface PdfFile {
  id: string;
  file: File;
  previewUrl?: string;
  originalSize: number;
  compressedSize?: number;
  status: 'pending' | 'compressing' | 'done' | 'error';
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const InfoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


const CompressTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [compressionLevel, setCompressionLevel] = useState(60);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // For the info tooltip
  const [explanation, setExplanation] = useState('');
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const explanationTimeoutRef = useRef<number | null>(null);

  const generatePdfPreview = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            if (!e.target?.result) return reject('FileReader error');
            const typedarray = new Uint8Array(e.target.result as ArrayBuffer);
            try {
                const pdfjsLib = (window as any).pdfjsLib;
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 0.5 });
                const canvas = document.createElement('canvas');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const context = canvas.getContext('2d');
                if (!context) return reject('Canvas context error');
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                resolve(canvas.toDataURL());
            } catch (error) {
                console.error("Error generating PDF preview:", error);
                // Return a placeholder or reject
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
  }, []);

  const addFiles = useCallback(async (newFiles: File[]) => {
    const pdfFiles = newFiles.filter(f => f.type === 'application/pdf');
    
    for (const file of pdfFiles) {
        const newFile: PdfFile = {
            id: `${file.name}-${file.lastModified}-${file.size}`,
            file,
            originalSize: file.size,
            status: 'pending',
        };

        // Avoid adding duplicates
        if (files.some(f => f.id === newFile.id)) continue;
        
        setFiles(prev => [...prev, newFile]);

        generatePdfPreview(file).then(previewUrl => {
            setFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, previewUrl } : f));
        }).catch(() => {
            setFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, status: 'error' } : f));
        });
    }
  }, [files, generatePdfPreview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const handleDeleteFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };
  
  const handleDeleteAll = () => {
    setFiles([]);
  };

  const handleCompress = () => {
    if (files.length === 0) return;

    setFiles(prevFiles => prevFiles.map(f => f.status === 'pending' || f.status === 'done' ? { ...f, status: 'compressing' } : f));

    const filesToCompress = files.filter(f => f.status !== 'compressing');

    filesToCompress.forEach(fileToCompress => {
        setTimeout(() => {
            // Simulate compression
            const reductionFactor = compressionLevel / 125; // Make it a bit more aggressive
            const compressedSize = fileToCompress.originalSize * (1 - reductionFactor);
            
            setFiles(prevFiles => prevFiles.map(f => 
                f.id === fileToCompress.id 
                ? { ...f, status: 'done', compressedSize: Math.max(1024, compressedSize) } // ensure not 0
                : f
            ));
        }, 500 + Math.random() * 1000); // simulate network/processing delay
    });
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, [addFiles]);

  // AI Explanation Fetching
  useEffect(() => {
    if (explanationTimeoutRef.current) {
        clearTimeout(explanationTimeoutRef.current);
    }
    setIsExplanationLoading(true);
    explanationTimeoutRef.current = window.setTimeout(() => {
        const levelText = compressionLevel < 33 ? 'Low' : compressionLevel < 66 ? 'Medium' : 'High';
        getCompressionExplanation('PDF', levelText).then(text => {
            setExplanation(text);
            setIsExplanationLoading(false);
        });
    }, 500); // Debounce
  }, [compressionLevel]);


  const FileCard: React.FC<{pdfFile: PdfFile}> = ({ pdfFile }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 flex flex-col justify-between border border-slate-200 dark:border-slate-700 aspect-[3/4] relative overflow-hidden">
        <div className="flex justify-between items-start text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{pdfFile.file.name}</span>
            <span className="text-slate-500 flex-shrink-0">{formatBytes(pdfFile.originalSize)}</span>
        </div>
        
        <div className="flex-grow flex items-center justify-center my-2 min-h-0">
            {pdfFile.previewUrl ? (
                <img src={pdfFile.previewUrl} alt="PDF preview" className="max-w-full max-h-full object-contain shadow-inner"/>
            ) : pdfFile.status === 'error' ? (
                <div className="text-center text-red-500 p-2">
                    <p className="font-semibold">Error</p>
                    <p>Could not generate preview.</p>
                </div>
            ) : (
                <div className="animate-pulse text-slate-400">Loading...</div>
            )}
        </div>
        
        {pdfFile.status === 'done' && pdfFile.compressedSize !== undefined ? (
            <div className="text-center mt-auto">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                    New Size: <span className="font-bold text-slate-900 dark:text-slate-100">{formatBytes(pdfFile.compressedSize)}</span>
                </p>
                <button className="mt-2 w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors">Download</button>
            </div>
        ) : pdfFile.status === 'compressing' ? (
             <div className="text-center mt-auto">
                <div className="animate-spin h-5 w-5 text-indigo-500 mx-auto"></div>
                <p className="text-sm mt-2">Compressing...</p>
            </div>
        ) : (
             <button onClick={() => handleDeleteFile(pdfFile.id)} className="absolute top-2 right-2 bg-slate-600/50 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs backdrop-blur-sm z-10">✕</button>
        )}
    </div>
  );

  const AddFilesButton = () => (
     <button onClick={() => fileInputRef.current?.click()} className="relative border-2 border-dashed rounded-lg text-center transition-colors duration-200 border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex flex-col items-center justify-center p-4 aspect-[3/4]">
        <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="mt-2 font-semibold text-sm">Add PDF Files</span>
        </div>
    </button>
  );


  if (files.length === 0) {
      return (
        <ToolContainer tool={tool} onBack={onBack}>
            <div 
              onDragEnter={handleDrag} 
              onDragLeave={handleDrag} 
              onDragOver={handleDrag} 
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-200 ${
                isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept={tool.accept} multiple className="hidden"/>
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-4 text-slate-600 dark:text-slate-400">
                  <span onClick={() => fileInputRef.current?.click()} className="font-semibold text-indigo-500 cursor-pointer">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  PDF files only
                </p>
              </div>
            </div>
        </ToolContainer>
      )
  }

  return (
    <ToolContainer tool={tool} onBack={onBack}>
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept={tool.accept} multiple className="hidden"/>
      <div className="border-b border-slate-200 dark:border-slate-700 pb-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
            <div className="flex-grow w-full">
                <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Compression Level</label>
                    <div className="relative group">
                        <InfoIcon />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {isExplanationLoading ? "Loading..." : explanation}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <input 
                        type="range"
                        min="0"
                        max="100"
                        value={compressionLevel}
                        onChange={(e) => setCompressionLevel(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="relative">
                      <input 
                          type="number"
                          min="0"
                          max="100"
                          value={compressionLevel}
                          onChange={(e) => setCompressionLevel(parseInt(e.target.value, 10))}
                          className="w-20 rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm text-center pr-6"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                <button onClick={handleCompress} className="w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">Compress</button>
                <button onClick={handleDeleteAll} className="w-full sm:w-auto bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">Delete All</button>
            </div>
        </div>
      </div>
      
      <div 
        onDragEnter={handleDrag} 
        onDragLeave={handleDrag} 
        onDragOver={handleDrag} 
        onDrop={handleDrop}
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 rounded-lg p-4 transition-colors ${isDragging ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
      >
        {files.map(pdfFile => <FileCard key={pdfFile.id} pdfFile={pdfFile} />)}
        <AddFilesButton />
      </div>

    </ToolContainer>
  );
};

export default CompressTool;