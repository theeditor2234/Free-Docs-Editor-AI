import React, { useState, useCallback } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File | File[]) => void;
  accept: string;
  multiple?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, accept, multiple = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const processFiles = useCallback(async (files: File[]) => {
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const filesToProcess = multiple ? files : [files[0]];

    // Only show progress for uploads > 500KB to avoid flash on small files
    if (totalSize < 500 * 1024) {
      onFileSelect(multiple ? filesToProcess : filesToProcess[0]);
      return;
    }

    setIsUploading(true);
    setProgress(0);

    let totalLoaded = 0;
    for (const file of filesToProcess) {
      try {
        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onprogress = (event) => {
            if (event.lengthComputable) {
              const currentFileProgress = event.loaded;
              const percent = Math.round(((totalLoaded + currentFileProgress) / totalSize) * 100);
              setProgress(percent);
            }
          };
          reader.onload = () => {
            totalLoaded += file.size;
            resolve();
          };
          reader.onerror = (error) => reject(error);
          reader.readAsArrayBuffer(file); // Reading as array buffer is efficient for progress
        });
      } catch (error) {
        console.error("Error reading file:", error);
        setIsUploading(false); // Reset on error
        return;
      }
    }
    
    setProgress(100);
    // Short delay to show 100% completion before handing off
    setTimeout(() => {
        setIsUploading(false);
        onFileSelect(multiple ? filesToProcess : filesToProcess[0]);
    }, 300);

  }, [multiple, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
      e.dataTransfer.clearData();
    }
  }, [processFiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       const files = Array.from(e.target.files);
       processFiles(files);
    }
  };

  if (isUploading) {
    return (
      <div className="border-2 border-dashed rounded-lg p-12 text-center border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20">
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Processing file...</p>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-indigo-600 h-4 rounded-full transition-all duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">{progress}%</p>
      </div>
    );
  }

  return (
    <div 
      onDragEnter={handleDrag} 
      onDragLeave={handleDrag} 
      onDragOver={handleDrag} 
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-200 ${
        isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600'
      }`}
    >
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        disabled={isUploading}
      />
      <div className="flex flex-col items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-indigo-500">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
          {accept.split(',').map(s => s.split('/')[1] || s).join(', ').toUpperCase()}
        </p>
      </div>
    </div>
  );
};

export default FileUploader;