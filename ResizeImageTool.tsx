import React, { useState, useEffect, useCallback } from 'react';
import type { Tool } from '../../types';
import FileUploader from '../FileUploader';
import ToolContainer from '../ToolContainer';

// Data structure for presets
type PresetGroup = 'SSC' | 'JKSSB';
type PresetType = 'Photograph' | 'Signature';

interface Preset {
  widthCm: number;
  heightCm: number;
  minSizeKb: number;
  maxSizeKb: number;
  dpi: number;
  widthPx: number;
  heightPx: number;
}

const CM_TO_INCH = 1 / 2.54;

const calculatePx = (cm: number, dpi: number) => Math.round(cm * CM_TO_INCH * dpi);

const PRESETS: Record<PresetGroup, Record<PresetType, Preset>> = {
  SSC: {
    Photograph: {
      widthCm: 3.5, heightCm: 4.5, minSizeKb: 20, maxSizeKb: 50, dpi: 200,
      widthPx: calculatePx(3.5, 200), heightPx: calculatePx(4.5, 200), // 276x354
    },
    Signature: {
      widthCm: 4.0, heightCm: 3.0, minSizeKb: 10, maxSizeKb: 20, dpi: 200,
      widthPx: calculatePx(4.0, 200), heightPx: calculatePx(3.0, 200), // 315x236
    },
  },
  JKSSB: {
    Photograph: {
      widthCm: 3.5, heightCm: 4.5, minSizeKb: 20, maxSizeKb: 50, dpi: 200,
      widthPx: calculatePx(3.5, 200), heightPx: calculatePx(4.5, 200), // 276x354
    },
    Signature: {
      widthCm: 3.5, heightCm: 1.5, minSizeKb: 10, maxSizeKb: 20, dpi: 200,
      widthPx: calculatePx(3.5, 200), heightPx: calculatePx(1.5, 200), // 276x118
    },
  },
};

// Helper functions
const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const findOptimalBlob = async (canvas: HTMLCanvasElement, minSize: number, maxSize: number): Promise<{blob: Blob | null, message: string}> => {
    const getBlob = (quality: number): Promise<Blob> => new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg', quality));

    const highQualityBlob = await getBlob(1.0);
    if (highQualityBlob.size < minSize) {
        return { blob: highQualityBlob, message: `Warning: Image is smaller (${formatBytes(highQualityBlob.size)}) than the minimum required size (${formatBytes(minSize)}) even at the highest quality.` };
    }

    const lowQualityBlob = await getBlob(0.1); // Use 0.1 as 0 can have issues
    if (lowQualityBlob.size > maxSize) {
        return { blob: null, message: `Error: Image is larger (${formatBytes(lowQualityBlob.size)}) than the maximum required size (${formatBytes(maxSize)}) even at the lowest quality.` };
    }
    
    // Binary search for quality
    let low = 0.1;
    let high = 1.0;
    let bestBlob: Blob | null = lowQualityBlob.size >= minSize ? lowQualityBlob : null;

    for (let i = 0; i < 8; i++) { // 8 iterations for precision
        const mid = (low + high) / 2;
        const blob = await getBlob(mid);
        if (blob.size > maxSize) {
            high = mid;
        } else {
            if (blob.size >= minSize) {
                bestBlob = blob;
            }
            low = mid;
        }
    }
    
    if (bestBlob) {
       return { blob: bestBlob, message: `Successfully compressed to ${formatBytes(bestBlob.size)}.`};
    }

    return { blob: null, message: 'Could not find a quality setting to meet the file size requirements.' };
};


// Main Component
const ResizeImageTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
    const [file, setFile] = useState<File | null>(null);
    const [presetGroup, setPresetGroup] = useState<PresetGroup>('SSC');
    const [presetType, setPresetType] = useState<PresetType>('Photograph');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ url: string; size: number; message: string; blob: Blob } | null>(null);

    const activePreset = PRESETS[presetGroup][presetType];

    const processImage = useCallback(async (imageFile: File, preset: Preset) => {
        setIsProcessing(true);
        setResult(null);

        const img = new Image();
        const reader = new FileReader();
        
        const imageLoadPromise = new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load image."));
            reader.onload = e => { img.src = e.target?.result as string };
            reader.onerror = () => reject(new Error("Failed to read file."));
            reader.readAsDataURL(imageFile);
        });

        try {
            await imageLoadPromise;

            const canvas = document.createElement('canvas');
            canvas.width = preset.widthPx;
            canvas.height = preset.heightPx;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not create canvas context.");

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, preset.widthPx, preset.heightPx);
            
            const { blob, message } = await findOptimalBlob(canvas, preset.minSizeKb * 1024, preset.maxSizeKb * 1024);
            
            if (blob) {
                const url = URL.createObjectURL(blob);
                setResult({ url, size: blob.size, message, blob });
            } else {
                setResult({ url: '', size: 0, message, blob: new Blob() }); // Error state
            }

        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            setResult({ url: '', size: 0, message, blob: new Blob() });
        } finally {
            setIsProcessing(false);
        }
    }, []);

    useEffect(() => {
        if (file) {
            processImage(file, activePreset);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    const handleFileSelect = (selectedFile: File | File[]) => {
        setResult(null);
        setFile(selectedFile as File);
    };

    const handleReset = () => {
        if (result && result.url) URL.revokeObjectURL(result.url);
        setFile(null);
        setResult(null);
    };

    const getDownloadFileName = () => {
        if (!file) return 'download.jpg';
        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
        return `${baseName}-${presetGroup}-${presetType}.jpg`;
    };

    const PresetSelector = () => (
        <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg space-y-4">
             <div>
                <span className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">Application Type</span>
                <div className="flex gap-2">
                    {(['SSC', 'JKSSB'] as PresetGroup[]).map(group => (
                        <button key={group} onClick={() => setPresetGroup(group)} className={`px-4 py-2 text-sm font-semibold rounded-md flex-1 transition-colors ${presetGroup === group ? 'bg-indigo-600 text-white shadow' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                            {group}
                        </button>
                    ))}
                </div>
            </div>
             <div>
                <span className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">Document Type</span>
                <div className="flex gap-2">
                    {(['Photograph', 'Signature'] as PresetType[]).map(type => (
                        <button key={type} onClick={() => setPresetType(type)} className={`px-4 py-2 text-sm font-semibold rounded-md flex-1 transition-colors ${presetType === type ? 'bg-indigo-600 text-white shadow' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                            {type}
                        </button>
                    ))}
                </div>
            </div>
            <div className="text-sm bg-indigo-50 dark:bg-slate-700 p-3 rounded-md text-slate-600 dark:text-slate-300">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Requirements:</h4>
                <ul className="list-disc list-inside space-y-1">
                    <li>Format: JPEG</li>
                    <li>Dimensions: {activePreset.widthCm}cm x {activePreset.heightCm}cm ({activePreset.widthPx}px x {activePreset.heightPx}px)</li>
                    <li>File Size: {activePreset.minSizeKb}KB - {activePreset.maxSizeKb}KB</li>
                </ul>
            </div>
        </div>
    );

    const ResultDisplay = () => {
        if (!result) return null;
        const isError = !result.blob.size;
        const messageColor = result.message.startsWith('Error') ? 'text-red-500' : result.message.startsWith('Warning') ? 'text-amber-500' : 'text-green-600 dark:text-green-400';

        return (
            <div className="text-center space-y-4">
                <div className={`p-2 rounded-md ${isError ? 'bg-red-100 dark:bg-red-900/50' : 'bg-slate-100 dark:bg-slate-900/50'}`}>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Result</h3>
                    {!isError && (
                        <img src={result.url} alt="Resized preview" className="max-w-full max-h-64 object-contain rounded-lg shadow-md mx-auto" />
                    )}
                </div>
                <div className={`text-sm font-semibold ${messageColor}`}>{result.message}</div>
                {!isError && (
                    <div className="flex justify-center gap-4">
                        <a href={result.url} download={getDownloadFileName()} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">
                            Download
                        </a>
                        <button onClick={handleReset} className="bg-slate-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-700 transition-colors">
                            Try Another
                        </button>
                    </div>
                )}
                 {isError && (
                     <button onClick={handleReset} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
                        Try Another Image
                    </button>
                 )}
            </div>
        );
    };

    const ProcessingView = () => (
        <div className="flex flex-col items-center justify-center h-64">
            <svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-semibold text-slate-700 dark:text-slate-300">Resizing and optimizing image...</p>
        </div>
    );
    
    return (
        <ToolContainer tool={tool} onBack={onBack}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                    <PresetSelector/>
                </div>
                <div>
                    {!file ? (
                        <FileUploader onFileSelect={handleFileSelect} accept={tool.accept} />
                    ) : isProcessing ? (
                        <ProcessingView />
                    ) : (
                        <ResultDisplay />
                    )}
                </div>
            </div>
        </ToolContainer>
    );
};

export default ResizeImageTool;
