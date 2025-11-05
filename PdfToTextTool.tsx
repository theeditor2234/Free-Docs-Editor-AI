import React, { useState, useEffect } from 'react';
import type { Tool } from '../../types';
import FileUploader from '../FileUploader';
import ToolContainer from '../ToolContainer';

const PdfToTextTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!file) {
        setExtractedText('');
        return;
    };

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
      const pdfjsLib = (window as any).pdfjsLib;
      try {
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';
        }
        setExtractedText(fullText);
      } catch (error) {
        console.error("Failed to extract text from PDF:", error);
        alert("Could not process PDF. It might be corrupted or password-protected.");
        setFile(null);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [file]);

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${file?.name.replace('.pdf','')}.txt`);
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
          <p className="font-semibold text-center mb-4 text-slate-800 dark:text-slate-200">File: {file.name}</p>
          {isProcessing ? (
            <p className="text-center">Extracting text...</p>
          ) : (
            <div>
              <textarea
                readOnly
                value={extractedText}
                className="w-full h-80 p-2 border rounded-lg bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-600 font-mono text-sm"
                placeholder="Extracted text will appear here..."
              />
              <div className="flex gap-4 mt-4">
                <button onClick={handleCopy} className="flex-1 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <button onClick={handleDownload} className="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                  Download .txt File
                </button>
              </div>
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

export default PdfToTextTool;