import React, { useState, useEffect } from 'react';
import type { Tool } from '../../types';
import FileUploader from '../FileUploader';
import ToolContainer from '../ToolContainer';
import { extractTextFromPdfPageAsMarkdown } from '../../services/geminiService';

const PdfToDocxTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedMarkdown, setExtractedMarkdown] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [copied, setCopied] = useState(false);

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    setExtractedMarkdown('');
    setProgress('Loading PDF...');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
      const pdfjsLib = (window as any).pdfjsLib;
      try {
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullMarkdown = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          setProgress(`Processing page ${i} of ${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          const context = canvas.getContext('2d');
          
          await page.render({ canvasContext: context!, viewport: viewport }).promise;

          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
          if (blob) {
            const imageFile = new File([blob], `page_${i}.png`, { type: 'image/png' });
            const pageMarkdown = await extractTextFromPdfPageAsMarkdown(imageFile);
            if (!pageMarkdown.startsWith('Error:')) {
                fullMarkdown += pageMarkdown + '\n\n---\n\n';
            } else {
                fullMarkdown += `*Error processing page ${i}.*\n\n---\n\n`;
            }
          }
          setExtractedMarkdown(fullMarkdown); // Update live
        }
        setProgress('Conversion complete!');
      } catch (error) {
        console.error("Failed to process PDF:", error);
        setProgress('Error');
        setExtractedMarkdown("Could not process PDF. It might be corrupted or password-protected.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(extractedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([extractedMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${file?.name.replace('.pdf','')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ToolContainer tool={tool} onBack={onBack}>
      {!file ? (
        <FileUploader onFileSelect={(f) => setFile(f as File)} accept={tool.accept} />
      ) : (
        <div>
          <div className="text-center mb-6">
            <p className="font-semibold text-slate-800 dark:text-slate-200">File: {file.name}</p>
            {!isProcessing && !extractedMarkdown && (
                <button onClick={handleConvert} className="mt-4 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300">
                    Convert to DOCX with AI
                </button>
            )}
          </div>

          {(isProcessing || extractedMarkdown) && (
            <div>
              <div className="mb-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-900">
                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">Conversion Result</h3>
                <p className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">{progress}</p>
                <textarea
                    readOnly
                    value={extractedMarkdown}
                    className="w-full h-80 p-2 border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 font-mono text-sm"
                    placeholder="Extracted content will appear here..."
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <button onClick={handleCopy} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <button onClick={handleDownload} className="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                  Download .md File
                </button>
              </div>
            </div>
          )}
           <button onClick={() => setFile(null)} className="w-full mt-8 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-500 py-3 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                Use another file
            </button>
        </div>
      )}
    </ToolContainer>
  );
};

export default PdfToDocxTool;
