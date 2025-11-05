
import React, { useState, useEffect, useCallback } from 'react';
import type { Tool } from '../../types';
import FileUploader from '../FileUploader';
import ToolContainer from '../ToolContainer';

interface ConvertPdfToImageToolProps {
  tool: Tool;
  onBack: () => void;
}

const ConvertPdfToImageTool: React.FC<ConvertPdfToImageToolProps> = ({ tool, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFormat, setImageFormat] = useState<'jpeg' | 'png'>('jpeg');

  useEffect(() => {
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdfjsLib = (window as any).pdfjsLib;
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
        setPdfDoc(null);
        setTotalPages(0);
        setCurrentPage(1);
        setImageUrl(null);
    }
  }, [file]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc) return;
    setIsLoading(true);
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const context = canvas.getContext('2d');
    
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    setImageUrl(canvas.toDataURL(`image/${imageFormat}`));
    setIsLoading(false);
  }, [pdfDoc, imageFormat]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, renderPage]);

  const handleFileSelect = (selectedFile: File | File[]) => {
    setFile(selectedFile as File);
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <ToolContainer tool={tool} onBack={onBack}>
      {!file ? (
        <FileUploader onFileSelect={handleFileSelect} accept={tool.accept} />
      ) : (
        <div>
          <div className="text-center mb-6">
            <p className="font-medium text-slate-700 dark:text-slate-300">File: {file.name}</p>
          </div>

          {isLoading && <p className="text-center">Loading PDF...</p>}

          {pdfDoc && (
            <div>
              <div className="flex justify-center items-center gap-4 mb-4">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50">&lt;</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50">&gt;</button>
              </div>
              
              <div className="flex justify-center items-center gap-4 mb-6">
                <label>Format:</label>
                <select value={imageFormat} onChange={(e) => setImageFormat(e.target.value as 'jpeg' | 'png')} className="rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  <option value="jpeg">JPG</option>
                  <option value="png">PNG</option>
                </select>
              </div>

              {imageUrl && (
                <div className="mt-4 text-center">
                  <h3 className="text-xl font-bold mb-4">Preview</h3>
                  <img src={imageUrl} alt={`Page ${currentPage}`} className="mx-auto max-w-full h-auto rounded-lg shadow-md border dark:border-slate-600" />
                  <a href={imageUrl} download={`page_${currentPage}_${file.name.replace('.pdf', '')}.${imageFormat === 'jpeg' ? 'jpg' : 'png'}`} className="mt-6 inline-block bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">
                    Download Page as {imageFormat.toUpperCase()}
                  </a>
                </div>
              )}
            </div>
          )}

          <button onClick={() => setFile(null)} className="w-full mt-4 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-500">
            Use another PDF
          </button>
        </div>
      )}
    </ToolContainer>
  );
};

export default ConvertPdfToImageTool;
