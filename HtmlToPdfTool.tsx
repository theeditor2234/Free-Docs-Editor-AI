import React, { useState, useRef } from 'react';
import type { Tool } from '../../types';
import FileUploader from '../FileUploader';
import ToolContainer from '../ToolContainer';

declare const html2canvas: any;

const HtmlToPdfTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleFileSelect = (selectedFile: File | File[]) => {
    const f = selectedFile as File;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = e.target?.result as string;
      }
    };
    reader.readAsText(f);
  };
  
  const handleConvert = async () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow?.document.body) {
      alert("Could not read the HTML file content.");
      return;
    }
    setIsProcessing(true);

    const body = iframeRef.current.contentWindow.document.body;
    const { jsPDF } = (window as any).jspdf;

    try {
        const canvas = await html2canvas(body, {
            allowTaint: true,
            useCORS: true,
            scale: 2,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'l' : 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${file?.name.replace('.html', '')}.pdf`);
    } catch (error) {
        console.error("Error converting HTML to PDF:", error);
        alert("An error occurred during conversion. Please check the console for details.");
    } finally {
        setIsProcessing(false);
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
          
          <div className="border rounded-lg p-4 bg-white dark:bg-slate-700 shadow mb-6">
             <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">Live Preview</h3>
             <iframe
                ref={iframeRef}
                title="HTML Preview"
                className="w-full h-64 border-2 border-slate-200 dark:border-slate-600 rounded"
                sandbox="allow-same-origin"
             />
          </div>

          <button onClick={handleConvert} disabled={isProcessing} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300">
            {isProcessing ? 'Converting...' : 'Convert to PDF'}
          </button>
          
          <button onClick={() => setFile(null)} className="w-full mt-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-500 py-3 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            Use another file
          </button>
        </div>
      )}
    </ToolContainer>
  );
};

export default HtmlToPdfTool;
