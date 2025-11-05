import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Tool } from '../../types';
import FileUploader from '../FileUploader';
import ToolContainer from '../ToolContainer';
import { extractTableDataAsCsv } from '../../services/geminiService';

const PdfToExcelTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [csvData, setCsvData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc) return;
    setIsProcessing(true);
    setCsvData(null);
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context!, viewport }).promise;
    }
    setIsProcessing(false);
  }, [pdfDoc]);

  useEffect(() => {
    if (file) {
      setIsProcessing(true);
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
            console.error("Error loading PDF", error);
            alert("Could not load PDF. It might be corrupted or password-protected.");
            setFile(null);
        } finally {
            setIsProcessing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [file]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, renderPage]);

  const handleExtract = async () => {
    if (!canvasRef.current) return;
    setIsExtracting(true);
    setCsvData('');
    
    canvasRef.current.toBlob(async (blob) => {
        if (blob) {
            const imageFile = new File([blob], "pdf_page.png", { type: "image/png" });
            const result = await extractTableDataAsCsv(imageFile);
            setCsvData(result);
        } else {
            setCsvData("Error: Could not create image from PDF page.");
        }
        setIsExtracting(false);
    }, 'image/png');
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDownload = () => {
    if (!csvData) return;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${file?.name.replace('.pdf','')}_page_${currentPage}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <ToolContainer tool={tool} onBack={onBack}>
      {!file ? (
        <FileUploader onFileSelect={(f) => setFile(f as File)} accept={tool.accept} />
      ) : (
        <div>
          <div className="flex justify-center items-center gap-4 mb-4">
             <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || isProcessing} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50">&lt;</button>
             <span>Page {currentPage} of {totalPages}</span>
             <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages || isProcessing} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50">&gt;</button>
           </div>
          
          <div className="bg-slate-200 dark:bg-slate-900 p-2 rounded-lg mb-4">
            <canvas ref={canvasRef} className="max-w-full h-auto mx-auto rounded" />
          </div>

          <button onClick={handleExtract} disabled={isExtracting || isProcessing} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300">
            {isProcessing ? 'Loading Page...' : isExtracting ? 'AI is Extracting...' : 'Extract Table Data with AI'}
          </button>

          {csvData && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Extracted CSV Data:</h3>
                <textarea readOnly value={csvData} className="w-full h-48 p-2 border rounded-lg bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-600 font-mono text-sm"></textarea>
                <button onClick={handleDownload} className="mt-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">Download .csv</button>
              </div>
          )}

          <button onClick={() => setFile(null)} className="w-full mt-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-500 py-3 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            Use another file
          </button>
        </div>
      )}
    </ToolContainer>
  );
};

export default PdfToExcelTool;