import React, { useState } from 'react';
import type { Tool } from '../../types';
import FileUploader from '../FileUploader';
import ToolContainer from '../ToolContainer';
import { extractTextFromImage } from '../../services/geminiService';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Chinese (Simplified)', 'Chinese (Traditional)', 'Japanese', 'Korean',
  'Russian', 'Arabic', 'Hindi', 'Bengali', 'Dutch', 'Swedish', 'Polish',
  'Turkish', 'Vietnamese', 'Thai'
];

const ImageToTextTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState('English');
  const [copied, setCopied] = useState(false);

  const handleFileSelect = (selectedFile: File | File[]) => {
    setFile(selectedFile as File);
    setExtractedText('');
  };

  const handleExtract = async () => {
    if (!file) return;
    setIsProcessing(true);
    setExtractedText('');
    const result = await extractTextFromImage(file, language);
    setExtractedText(result);
    setIsProcessing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${file?.name.split('.')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ToolContainer tool={tool} onBack={onBack}>
      {!file ? (
        <FileUploader onFileSelect={handleFileSelect} accept={tool.accept} />
      ) : (
        <div>
          <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
            <img src={URL.createObjectURL(file)} alt="Preview" className="w-full md:w-64 h-auto object-contain rounded-lg shadow-md bg-slate-100 dark:bg-slate-700 p-2" />
            <div className="w-full">
              <p className="font-medium text-slate-700 dark:text-slate-300">File: {file.name}</p>
              <div className="mt-4">
                <label htmlFor="language-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Language of Text in Image
                </label>
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>
              </div>
              <button
                onClick={handleExtract}
                disabled={isProcessing}
                className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
              >
                {isProcessing ? 'AI is Reading...' : 'Extract Text with AI'}
              </button>
            </div>
          </div>

          {isProcessing && (
             <div className="text-center p-8 flex flex-col items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>AI is processing your image...</p>
            </div>
          )}

          {extractedText && (
            <div className="mt-6 border-t dark:border-slate-600 pt-6">
              <h3 className="text-lg font-semibold mb-2">Extracted Text:</h3>
              <textarea
                readOnly
                value={extractedText}
                className="w-full h-64 p-2 border rounded-lg bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-600 font-sans text-sm"
                placeholder="Extracted text will appear here..."
              />
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <button onClick={handleCopy} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <button onClick={handleDownload} className="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                  Download .txt File
                </button>
              </div>
            </div>
          )}

          <button onClick={() => setFile(null)} className="w-full mt-8 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-500">
            Use another image
          </button>
        </div>
      )}
    </ToolContainer>
  );
};

export default ImageToTextTool;
