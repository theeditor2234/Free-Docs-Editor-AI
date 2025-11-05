import React, { useState, useEffect, useCallback } from 'react';
import type { Tool } from '../../types';
import FileUploader from '../FileUploader';
import ToolContainer from '../ToolContainer';

declare const JSZip: any;

const SplitPdfTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const generateThumbnails = useCallback(async (pdf: any) => {
    setIsProcessing(true);
    const thumbnails: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      canvas.height = Number(viewport.height);
      canvas.width = Number(viewport.width);
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
          setSelectedPages(new Set());
          await generateThumbnails(pdf);
        } catch (error) {
          console.error("Failed to load PDF:", error);
          alert("Could not load PDF. It might be corrupted or password-protected.");
          setFile(null);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setPdfDoc(null);
      setPageThumbnails([]);
      setSelectedPages(new Set());
    }
  }, [file, generateThumbnails]);
  
  const handlePageSelect = (pageNumber: number) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) {
        newSet.delete(pageNumber);
      } else {
        newSet.add(pageNumber);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPages.size === pageThumbnails.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(Array.from({ length: pageThumbnails.length }, (_, i) => i + 1)));
    }
  }

  const handleAction = async (mode: 'extract' | 'split') => {
    if (!pdfDoc || selectedPages.size === 0) return;
    setIsProcessing(true);
    
    const { jsPDF } = (window as any).jspdf;
    const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
    
    const processPage = async (pageNum: number): Promise<{ dataUrl: string; width: number; height: number; }> => {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      
      const width = Number(viewport.width);
      const height = Number(viewport.height);
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d')!;
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      return {
        dataUrl: canvas.toDataURL('image/jpeg', 0.95),
        width,
        height,
      };
    };

    if (mode === 'extract') {
        const firstPageData = await processPage(sortedPages[0]);
        const orientation = firstPageData.width > firstPageData.height ? 'l' : 'p';
        const doc = new jsPDF({ orientation, unit: 'pt', format: [firstPageData.width, firstPageData.height] });
        doc.addImage(firstPageData.dataUrl, 'JPEG', 0, 0, firstPageData.width, firstPageData.height);

        for (let i = 1; i < sortedPages.length; i++) {
            const pageData = await processPage(sortedPages[i]);
            doc.addPage([pageData.width, pageData.height], pageData.width > pageData.height ? 'l' : 'p');
            doc.addImage(pageData.dataUrl, 'JPEG', 0, 0, pageData.width, pageData.height);
        }
        doc.save(`extracted-pages-from-${file?.name}`);
    } else { // split mode
        const zip = new JSZip();
        for (const pageNum of sortedPages) {
            const pageData = await processPage(pageNum);
            const orientation = pageData.width > pageData.height ? 'l' : 'p';
            const doc = new jsPDF({ orientation, unit: 'pt', format: [pageData.width, pageData.height] });
            doc.addImage(pageData.dataUrl, 'JPEG', 0, 0, pageData.width, pageData.height);
            const pdfBlob = doc.output('blob');
            zip.file(`page_${pageNum}_from_${file?.name}`, pdfBlob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(zipBlob);
        link.href = url;
        link.download = `split-pages-from-${file?.name}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
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
            <p className="text-sm text-slate-600 dark:text-slate-400">Select pages to split or extract. {selectedPages.size} selected.</p>
          </div>
          
          {isProcessing && pageThumbnails.length === 0 ? <p className="text-center">Generating thumbnails...</p> : (
            <>
            <div className="flex justify-center mb-4">
                <button onClick={handleSelectAll} className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                    {selectedPages.size === pageThumbnails.length ? 'Deselect All' : 'Select All'}
                </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-h-96 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
              {pageThumbnails.map((src, index) => (
                <div key={index} onClick={() => handlePageSelect(index + 1)} className={`relative rounded-lg overflow-hidden cursor-pointer border-4 ${selectedPages.has(index + 1) ? 'border-indigo-500' : 'border-transparent'}`}>
                  <img src={src} alt={`Page ${index + 1}`} className="w-full h-auto" />
                   {selectedPages.has(index + 1) && (
                     <div className="absolute inset-0 bg-indigo-500/50 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                     </div>
                   )}
                  <div className="absolute top-1 right-1 bg-slate-800/50 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{index + 1}</div>
                </div>
              ))}
            </div>
            </>
          )}
          
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => handleAction('extract')} disabled={isProcessing || selectedPages.size === 0} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300">
              {isProcessing ? 'Processing...' : `Extract ${selectedPages.size} Pages`}
            </button>
            <button onClick={() => handleAction('split')} disabled={isProcessing || selectedPages.size === 0} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300">
              {isProcessing ? 'Processing...' : `Split to ${selectedPages.size} Files`}
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

export default SplitPdfTool;