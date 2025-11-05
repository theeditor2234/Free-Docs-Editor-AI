import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Tool } from '../../types';
import FileUploader from '../FileUploader';
import ToolContainer from '../ToolContainer';

interface CropBox { x: number; y: number; width: number; height: number; }

const CropPdfTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc) return;
    setIsProcessing(true);
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context!, viewport }).promise;
    }
    setCropBox(null);
    setIsProcessing(false);
  }, [pdfDoc]);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdfjsLib = (window as any).pdfjsLib;
        try {
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          setPdfDoc(pdf);
          setTotalPages(pdf.numPages);
          setCurrentPage(1);
        } catch (error) {
          alert("Could not load PDF. It might be corrupted or password-protected.");
          setFile(null);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [file]);

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage);
  }, [pdfDoc, currentPage, renderPage]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    isDragging.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    dragStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setCropBox({ x: dragStart.current.x, y: dragStart.current.y, width: 0, height: 0 });
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const x = Math.min(dragStart.current.x, currentX);
    const y = Math.min(dragStart.current.y, currentY);
    const width = Math.abs(currentX - dragStart.current.x);
    const height = Math.abs(currentY - dragStart.current.y);
    setCropBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleSave = async (applyToAll: boolean) => {
    if (!pdfDoc || !cropBox || cropBox.width === 0 || cropBox.height === 0) return;
    setIsProcessing(true);

    const { jsPDF } = (window as any).jspdf;
    const orientation = cropBox.width > cropBox.height ? 'l' : 'p';
    const doc = new jsPDF({ orientation, unit: 'pt', format: [cropBox.width, cropBox.height] });
    doc.deletePage(1); // remove default first page
    
    const processPage = async (pageNum: number) => {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;
      const tempCtx = tempCanvas.getContext('2d');
      await page.render({ canvasContext: tempCtx!, viewport }).promise;

      doc.addPage([cropBox.width, cropBox.height], orientation);
      doc.addImage(tempCanvas, 'PNG', -cropBox.x, -cropBox.y, tempCanvas.width, tempCanvas.height);
    };

    if (applyToAll) {
      for (let i = 1; i <= totalPages; i++) {
        await processPage(i);
      }
    } else {
      await processPage(currentPage);
    }

    doc.save(`cropped-${file?.name}`);
    setIsProcessing(false);
  };
  
  return (
    <ToolContainer tool={tool} onBack={onBack}>
      {!file ? (
        <FileUploader onFileSelect={(f) => setFile(f as File)} accept={tool.accept} />
      ) : (
        <div>
          <div className="relative w-full max-w-full mx-auto overflow-auto bg-slate-200 dark:bg-slate-600" style={{ cursor: 'crosshair' }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <canvas ref={canvasRef} className="w-full h-auto" />
            {cropBox && (
              <div ref={cropAreaRef} className="absolute border-2 border-dashed border-red-500 bg-red-500/20" style={{
                left: cropBox.x,
                top: cropBox.y,
                width: cropBox.width,
                height: cropBox.height
              }}/>
            )}
            {isProcessing && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-20"><p>Loading...</p></div>}
          </div>

          <div className="flex justify-center items-center gap-4 mt-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1 || isProcessing} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50 font-semibold">Prev</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages || isProcessing} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50 font-semibold">Next</button>
          </div>
          
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => handleSave(false)} disabled={!cropBox || isProcessing} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300">
              Crop Current Page
            </button>
             <button onClick={() => handleSave(true)} disabled={!cropBox || isProcessing} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300">
              Crop All Pages
            </button>
          </div>
          <button onClick={() => setFile(null)} className="w-full mt-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-500 py-3 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
              Use another file
          </button>
        </div>
      )}
    </ToolContainer>
  );
};

export default CropPdfTool;
