import React, { useState, useEffect, useRef } from 'react';
import type { Tool } from '../../types';
import FileUploader from '../FileUploader';
import ToolContainer from '../ToolContainer';

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ImageEnlargerTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ w: number, h: number } | null>(null);
  const [scale, setScale] = useState<number>(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [enlargedFileInfo, setEnlargedFileInfo] = useState<{ size: string, w: number, h: number } | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setOriginalImageUrl(url);
      
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ w: img.width, h: img.height });
      };
      img.src = url;

      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
      setOriginalDimensions(null);
      setEnlargedImageUrl(null);
      setEnlargedFileInfo(null);
    }
  }, [file]);

  const handleEnlarge = () => {
    if (!originalImageUrl || !originalDimensions) return;
    setIsProcessing(true);
    setEnlargedImageUrl(null);
    setEnlargedFileInfo(null);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const newWidth = originalDimensions.w * scale;
      const newHeight = originalDimensions.h * scale;
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
      }
      
      const dataUrl = canvas.toDataURL(file?.type, 0.95);
      setEnlargedImageUrl(dataUrl);

      canvas.toBlob((blob) => {
        if (blob) {
            setEnlargedFileInfo({
                size: formatBytes(blob.size),
                w: newWidth,
                h: newHeight,
            });
        }
        setIsProcessing(false);
      }, file?.type, 0.95);
    };
    img.src = originalImageUrl;
  };
  
  const getDownloadFileName = () => {
    if (!file) return 'download';
    const extension = file.name.split('.').pop();
    const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
    return `enlarged-${scale}x-${baseName}.${extension}`;
  };
  
  const EditorView = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="text-center">
                <h3 className="font-semibold mb-2">Original Image</h3>
                <div className="flex justify-center bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg min-h-[200px] items-center">
                    <img src={originalImageUrl!} alt="Original preview" className="max-w-full max-h-48 object-contain rounded-lg shadow-md" />
                </div>
                {originalDimensions && <p className="text-sm mt-2 text-slate-500">{originalDimensions.w} x {originalDimensions.h} px</p>}
            </div>
            <div className="text-center">
                <h3 className="font-semibold mb-2">Upscaled Preview</h3>
                <div className="flex justify-center items-center bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg min-h-[200px]">
                    {isProcessing ? (
                         <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : enlargedImageUrl ? (
                        <img src={enlargedImageUrl} alt="Enlarged" className="max-w-full max-h-48 object-contain rounded-lg shadow-md" />
                    ) : <p className="text-slate-400">Preview will appear here</p>}
                </div>
                {enlargedFileInfo && <p className="text-sm mt-2 text-slate-500">{enlargedFileInfo.w} x {enlargedFileInfo.h} px &bull; {enlargedFileInfo.size}</p>}
            </div>
        </div>
      
        <div className="border-t dark:border-slate-700 pt-6">
            <div className="max-w-md mx-auto space-y-4">
                <div>
                    <label htmlFor="scale-select" className="block text-sm font-medium text-center text-slate-700 dark:text-slate-300">Upscale Factor</label>
                    <select id="scale-select" value={scale} onChange={e => setScale(Number(e.target.value))} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        <option value={2}>2x</option>
                        <option value={4}>4x</option>
                    </select>
                </div>
                <button onClick={handleEnlarge} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300" disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Enlarge Image'}
                </button>
            </div>
        </div>

      {enlargedImageUrl && (
        <div className="mt-4 text-center border-t dark:border-slate-700 pt-6">
          <a href={enlargedImageUrl} download={getDownloadFileName()} className="inline-block bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">
            Download Enlarged Image
          </a>
        </div>
      )}
      
      <div className="text-center mt-6">
        <button onClick={() => setFile(null)} className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-500">
            Use another image
        </button>
      </div>
    </div>
  );

  return (
    <ToolContainer tool={tool} onBack={onBack}>
      {!file 
        ? <FileUploader onFileSelect={(selectedFile) => setFile(selectedFile as File)} accept={tool.accept} /> 
        : <EditorView />
      }
    </ToolContainer>
  );
};

export default ImageEnlargerTool;
