import React, { useState } from 'react';
import type { Tool } from '../../types';
import ToolContainer from '../ToolContainer';

/**
 * Converts a Data URL to a Blob object. This is a robust, synchronous way to create a blob.
 * @param dataurl The Data URL string.
 * @returns A Blob object or null if conversion fails.
 */
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


/**
 * Sets the DPI for a JPEG image blob by modifying its JFIF header.
 * If the blob is not a JPEG or doesn't have a JFIF header, it returns the original blob.
 * @param blob The input image blob.
 * @param dpi The target DPI value.
 * @returns A promise that resolves with the modified blob, or the original if modification fails.
 */
const setImageDpi = async (blob: Blob, dpi: number): Promise<Blob> => {
    if (blob.type !== 'image/jpeg') {
        return blob;
    }

    const arrayBuffer = await blob.arrayBuffer();
    const view = new DataView(arrayBuffer);

    if (view.getUint16(0, false) !== 0xFFD8) {
        console.error("Not a valid JPEG file.");
        return blob;
    }

    let offset = 2;
    while (offset < view.byteLength) {
        if (offset + 2 > view.byteLength) break;
        const marker = view.getUint16(offset, false);
        offset += 2;

        if (marker === 0xFFE0) { // APP0 Marker for JFIF
            if (offset + 12 > view.byteLength) break;
            const jfifOffset = offset + 2;
            const signature = [
                view.getUint8(jfifOffset), view.getUint8(jfifOffset + 1),
                view.getUint8(jfifOffset + 2), view.getUint8(jfifOffset + 3),
                view.getUint8(jfifOffset + 4)
            ];

            if (signature[0] === 0x4A && signature[1] === 0x46 && signature[2] === 0x49 && signature[3] === 0x46 && signature[4] === 0x00) {
                view.setUint8(jfifOffset + 7, 1); // Set density units to 1 (dots per inch)
                view.setUint16(jfifOffset + 8, dpi); // Set X density
                view.setUint16(jfifOffset + 10, dpi); // Set Y density
                return new Blob([arrayBuffer], { type: 'image/jpeg' });
            }
        }
        
        if (marker >= 0xFFD0 && marker <= 0xFFD9 || marker === 0xFF01) {
            // Markers without length field, continue
        } else {
            if (offset + 2 > view.byteLength) break;
            const length = view.getUint16(offset, false);
            if (length < 2) break; // Invalid length
            offset += length - 2;
        }
    }
    return blob; // Return original if JFIF not found
};

interface ResizePanelProps {
  title: string;
  docType: 'Photo' | 'Signature';
  defaultW: number;
  defaultH: number;
  defaultDpi: number;
}

const ResizePanel: React.FC<ResizePanelProps> = ({ title, docType, defaultW, defaultH, defaultDpi }) => {
    const [file, setFile] = useState<File | null>(null);
    const [width, setWidth] = useState<string>(String(defaultW));
    const [height, setHeight] = useState<string>(String(defaultH));
    const [dpi, setDpi] = useState<string>(String(defaultDpi));
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        } else {
            setFile(null);
        }
    };

    const handleProcess = async () => {
        if (!file) {
            alert(`Please upload a ${docType}.`);
            return;
        }
        const targetWidth = parseInt(width, 10);
        const targetHeight = parseInt(height, 10);
        const targetDpi = parseInt(dpi, 10);
        
        if (isNaN(targetWidth) || isNaN(targetHeight) || isNaN(targetDpi) || targetWidth <= 0 || targetHeight <= 0 || targetDpi <= 0) {
            alert("Please enter valid positive numbers for dimensions and DPI.");
            return;
        }
        
        setIsProcessing(true);
        
        try {
            const imageUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (err) => reject(new Error("Failed to read the file."));
                reader.readAsDataURL(file);
            });

            const img = new Image();
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load the uploaded image. It might be corrupted or an unsupported format.'));
                img.src = imageUrl;
            });

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get canvas context.');
            }
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            if (!dataUrl || dataUrl === 'data:,') {
                throw new Error("Failed to generate image data from canvas. The image might be too large or corrupted.");
            }
            const resizedBlob = dataURLtoBlob(dataUrl);

            if (!resizedBlob) {
                throw new Error("Failed to convert processed image to a file for download.");
            }
            
            const finalBlob = await setImageDpi(resizedBlob, targetDpi);
            
            // Definitive Fix: Use FileReader to create a data URL, bypassing the unstable URL.createObjectURL.
            const downloadUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        resolve(reader.result as string);
                    } else {
                        reject(new Error("Failed to create download link from processed file."));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(finalBlob);
            });
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${docType.toLowerCase()}_${targetWidth}x${targetHeight}_${targetDpi}dpi.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // No need to revoke URL as we are using a Data URL.

        } catch (error) {
            console.error("Error processing image:", error);
            alert(error instanceof Error ? error.message : "An unexpected error occurred during processing.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50" style={{background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)'}}>
            <h3 className="text-xl font-bold text-center mb-4 text-blue-400">{title}</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300">Upload {docType}:</label>
                    <input type="file" onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300">Required Width in Pixels:</label>
                    <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm text-white" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300">Required Height in Pixels:</label>
                    <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm text-white" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300">Required DPI Value:</label>
                    <input type="number" value={dpi} onChange={(e) => setDpi(e.target.value)} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm text-white" />
                </div>
                <button onClick={handleProcess} disabled={isProcessing} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400">
                    {isProcessing ? 'Processing...' : `Get ${docType}`}
                </button>
            </div>
        </div>
    );
}


const PanCroppingTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
    return (
        <ToolContainer tool={tool} onBack={onBack}>
            <div className="p-4 sm:p-8 rounded-xl" style={{
                background: 'radial-gradient(circle, rgba(30,27,58,1) 0%, rgba(18,16,36,1) 100%)',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ResizePanel title="Photo Resize" docType="Photo" defaultW={213} defaultH={213} defaultDpi={300} />
                    <ResizePanel title="Signature Resize" docType="Signature" defaultW={400} defaultH={200} defaultDpi={600} />
                </div>
            </div>
        </ToolContainer>
    );
};

export default PanCroppingTool;