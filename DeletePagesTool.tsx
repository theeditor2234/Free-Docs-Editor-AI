import React, { useState, useEffect, useCallback } from 'react';
import type { Tool } from '../../types';
import FileUploader from '../FileUploader';
import ToolContainer from '../ToolContainer';

const DeletePagesTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [pagesToDelete, setPagesToDelete] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const generateThumbnails = useCallback(async (pdf: any) => {
    setIsProcessing(true);
    const thumbnails: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context!, viewport: viewport }).promise;
      thumbnails.push(canvas.toDataURL());
    }
    setPageThumbnails(thumbnails);
    setIsProcessing(false);
  }, []);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdfjsLib = (window as any).pdfjsLib;
        try {
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          setPdfDoc(pdf);
          setPagesToDelete(new Set());
          await generateThumbnails(pdf);
        } catch (error) {
          console.error("Failed to load PDF:", error);
          alert("Could not load PDF. It might be corrupted or password-protected.");
          setFile(null);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [file, generateThumbnails]);

  const handlePageSelect = (pageNumber: number) => {
    setPagesToDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) {
        newSet.delete(pageNumber);
      } else {
        newSet.add(pageNumber);
      }
      return newSet;
    });
  };

  const handleDelete = async () => {
    if (!pdfDoc || pagesToDelete.size === 0) return;
    if (pagesToDelete.size === pdfDoc.numPages) {
        alert("You cannot delete all pages of the document.");
        return;
    }
    setIsProcessing(true);

    const { jsPDF } = (window as any).jspdf;
    
    const pagesToKeep = Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1)
        .filter(pageNum => !pagesToDelete.has(pageNum));

    const firstPageToKeep = await pdfDoc.getPage(pagesToKeep[0]);
    const viewport = firstPageToKeep.getViewport({ scale: 1.0 });
    const orientation = viewport.width > viewport.height ? 'l' : 'p';
    const doc = new jsPDF({ orientation, unit: 'pt', format: [viewport.width, viewport.height]});
    doc.deletePage(1);

    for (const pageNum of pagesToKeep) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        doc.addPage([viewport.width, viewport.height], viewport.width > viewport.height ? 'l' : 'p');
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        const tempCtx = tempCanvas.getContext('2d');
        await page.render({canvasContext: tempCtx!, viewport}).promise;

        doc.addImage(tempCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, viewport.width, viewport.height);
    }
    
    doc.save(`deleted-pages-from-${file?.name}`);
    setIsProcessing(false);
  };

  return (
    <ToolContainer tool={tool} onBack={onBack}>
      {!file ? (
        <FileUploader onFileSelect={(f) => setFile(f as File)} accept={tool.accept} />
      ) : (
        <div>
          <div className="text-center mb-4">
            <p className="font-semibold text-slate-800 dark:text-slate-200">{file.name} ({pageThumbnails.length} pages)</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Select pages to delete. {pagesToDelete.size} selected.</p>
          </div>
          
          {isProcessing && pageThumbnails.length === 0 ? <p className="text-center">Generating thumbnails...</p> : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-h-96 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
              {pageThumbnails.map((src, index) => (
                <div key={index} onClick={() => handlePageSelect(index + 1)} className={`relative rounded-lg overflow-hidden cursor-pointer border-4 ${pagesToDelete.has(index + 1) ? 'border-red-500' : 'border-transparent'}`}>
                  <img src={src} alt={`Page ${index + 1}`} className="w-full h-auto" />
                   {pagesToDelete.has(index + 1) && (
                     <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                     </div>
                   )}
                  <div className="absolute top-1 right-1 bg-slate-800/50 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{index + 1}</div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 grid grid-cols-1 gap-4">
            <button onClick={handleDelete} disabled={isProcessing || pagesToDelete.size === 0} className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300">
              {isProcessing ? 'Processing...' : `Delete ${pagesToDelete.size} Selected Pages`}
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

export default DeletePagesTool;