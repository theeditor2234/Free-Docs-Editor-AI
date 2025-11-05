import React, { useState, useRef } from 'react';
import type { Tool } from '../../types';
import ToolContainer from '../ToolContainer';

// --- Helper Functions ---
const dataURLtoBlob = (dataurl: string): Blob | null => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// --- ImageDropArea Sub-component ---
interface ImageDropAreaProps {
  onFileSelect: (file: File) => void;
  imagePreviewUrl: string | null;
  onClear: () => void;
  title: string;
  accept: string;
}

const ImageDropArea: React.FC<ImageDropAreaProps> = ({ onFileSelect, imagePreviewUrl, onClear, title, accept }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  if (imagePreviewUrl) {
    return (
      <div className="relative group bg-slate-100 dark:bg-slate-900 rounded-lg p-2 h-48 flex items-center justify-center">
        <img src={imagePreviewUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded" />
        <button onClick={onClear} className="absolute top-2 right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors duration-200 h-48 flex flex-col items-center justify-center ${
        isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600'
      }`}
    >
      <input type="file" ref={inputRef} onChange={handleFileChange} className="hidden" accept={accept} />
      <p className="text-slate-500 dark:text-slate-400 mb-2">Drop image here...</p>
      <button onClick={() => inputRef.current?.click()} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 text-sm">
        {title}
      </button>
    </div>
  );
};

// --- Main Tool Component ---
interface ImageState {
  file: File;
  url: string;
}

interface MergedResult {
    url?: string;
    size?: number;
    width?: number;
    height?: number;
    type: 'image/jpeg' | 'image/png' | 'pdf';
}

const MergeImageTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
    const [frontImage, setFrontImage] = useState<ImageState | null>(null);
    const [backImage, setBackImage] = useState<ImageState | null>(null);
    const [mergedResult, setMergedResult] = useState<MergedResult | null>(null);
    const [outputFormat, setOutputFormat] = useState<'jpeg' | 'png' | 'pdf'>('jpeg');
    const [isMerging, setIsMerging] = useState(false);
    const [jpegQuality, setJpegQuality] = useState<number>(92);
    const mergedCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const handleClearAll = () => {
        setFrontImage(null);
        setBackImage(null);
        setMergedResult(null);
        setIsMerging(false);
        mergedCanvasRef.current = null;
    };

    const handleFileSelect = (type: 'front' | 'back', file: File) => {
        const url = URL.createObjectURL(file);
        const setter = type === 'front' ? setFrontImage : setBackImage;
        setter({ file, url });
        setMergedResult(null);
    };

    const getDownloadFileName = () => `merged-image.${outputFormat}`;
    
    const handleMerge = async () => {
        if (!frontImage || !backImage) return;
        setIsMerging(true);

        const frontImg = new Image();
        const backImg = new Image();
        const frontPromise = new Promise<void>(res => { frontImg.onload = () => res(); frontImg.src = frontImage.url; });
        const backPromise = new Promise<void>(res => { backImg.onload = () => res(); backImg.src = backImage.url; });
        await Promise.all([frontPromise, backPromise]);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            alert('Could not get canvas context');
            setIsMerging(false);
            return;
        }

        canvas.width = frontImg.width + backImg.width;
        canvas.height = Math.max(frontImg.height, backImg.height);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(frontImg, 0, 0);
        ctx.drawImage(backImg, frontImg.width, 0);
        
        mergedCanvasRef.current = canvas;

        if (outputFormat === 'pdf') {
            const { jsPDF } = (window as any).jspdf;
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const orientation = canvas.width > canvas.height ? 'l' : 'p';
            const doc = new jsPDF({ orientation, unit: 'px', format: [canvas.width, canvas.height] });
            doc.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            doc.save(getDownloadFileName());
            setMergedResult({ type: 'pdf' });
            setIsMerging(false);
        } else {
            const mimeType = `image/${outputFormat}`;
            const dataUrl = canvas.toDataURL(mimeType, outputFormat === 'jpeg' ? jpegQuality / 100 : undefined);
            const blob = dataURLtoBlob(dataUrl);
            setMergedResult({
                url: dataUrl,
                size: blob?.size || 0,
                width: canvas.width,
                height: canvas.height,
                type: mimeType as 'image/jpeg' | 'image/png',
            });
            setIsMerging(false);
        }
    };

    const handleQualityApply = () => {
        if (!mergedCanvasRef.current || outputFormat !== 'jpeg' || !mergedResult) return;
        const canvas = mergedCanvasRef.current;
        const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality / 100);
        const blob = dataURLtoBlob(dataUrl);
        setMergedResult({ ...mergedResult, url: dataUrl, size: blob?.size || 0 });
    };

    const renderContent = () => {
        if (isMerging) {
            return (
                <div className="min-h-[400px] flex items-center justify-center">
                    <div className="text-center">
                         <svg className="animate-spin h-8 w-8 text-indigo-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-lg font-semibold">Merging images...</p>
                    </div>
                </div>
            );
        }

        if (mergedResult) {
            // Result View
            return (
                <div className="space-y-6">
                    {mergedResult.type === 'pdf' ? (
                        <div className="text-center p-8 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-2xl font-bold mt-4 text-slate-800 dark:text-slate-200">PDF Generated!</h3>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">Your merged images have been downloaded as a PDF file.</p>
                            <button onClick={handleClearAll} className="mt-6 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
                                Start Over
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-4">
                                <button onClick={() => setMergedResult(null)} className="flex items-center gap-2 p-3 bg-slate-200 dark:bg-slate-700 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <a href={mergedResult.url} download={getDownloadFileName()} className="flex-1 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 text-center transition-colors">
                                    Download Image
                                </a>
                                <button onClick={handleClearAll} title="Start Over" className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                            
                            {mergedResult.type === 'image/jpeg' && (
                                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-900/50">
                                    <label htmlFor="quality-slider" className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">Resize Quality</label>
                                    <input id="quality-slider" type="range" min="1" max="100" value={jpegQuality} onChange={(e) => setJpegQuality(parseInt(e.target.value, 10))} className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer" />
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 w-12 text-center">{jpegQuality}%</span>
                                    <button onClick={handleQualityApply} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 text-sm">
                                        Apply
                                    </button>
                                </div>
                            )}

                            <div className="bg-slate-100 dark:bg-slate-900/50 rounded-lg p-4 flex items-center justify-center">
                                 <div className="text-center">
                                     <img src={mergedResult.url} alt="Merged Result" className="max-w-full max-h-96 object-contain rounded shadow-md" />
                                     <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                        {mergedResult.width} x {mergedResult.height} px &bull; {formatBytes(mergedResult.size || 0)}
                                     </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            );
        }

        // Upload View
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageDropArea
                        title="Front Image"
                        accept={tool.accept}
                        imagePreviewUrl={frontImage?.url || null}
                        onFileSelect={(file) => handleFileSelect('front', file)}
                        onClear={() => setFrontImage(null)}
                    />
                    <ImageDropArea
                        title="Back Image"
                        accept={tool.accept}
                        imagePreviewUrl={backImage?.url || null}
                        onFileSelect={(file) => handleFileSelect('back', file)}
                        onClear={() => setBackImage(null)}
                    />
                </div>

                <div className="flex items-center justify-between gap-4 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                     <div>
                        <label htmlFor="format-select" className="sr-only">Output format</label>
                        <select
                            id="format-select"
                            value={outputFormat}
                            onChange={(e) => setOutputFormat(e.target.value as 'jpeg' | 'png' | 'pdf')}
                            className="rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            <option value="jpeg">JPEG</option>
                            <option value="png">PNG</option>
                            <option value="pdf">PDF</option>
                        </select>
                    </div>
                     <div className="flex items-center justify-end gap-2">
                         <button onClick={handleClearAll} title="Clear All" className="p-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                         <button
                            onClick={handleMerge}
                            disabled={!frontImage || !backImage || isMerging}
                            className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                         >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ToolContainer tool={tool} onBack={onBack}>
            {renderContent()}
        </ToolContainer>
    );
};

export default MergeImageTool;