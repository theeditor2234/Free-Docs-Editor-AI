
import React, { useState } from 'react';
import Header from './components/Header';
import ToolCard from './components/ToolCard';
import { TOOLS, ToolId } from './constants';
import ResizeImageTool from './components/tools/ResizeImageTool';
import ConvertPdfToImageTool from './components/tools/ConvertPdfToImageTool';
import ConvertImageToPdfTool from './components/tools/ConvertImageToPdfTool';
import MergeImageTool from './components/tools/MergeImageTool';
import CompressTool from './components/tools/CompressTool';
import SmartRenameTool from './components/tools/SmartRenameTool';
import EditPdfTool from './components/tools/EditPdfTool';
import SplitPdfTool from './components/tools/SplitPdfTool';
import CropPdfTool from './components/tools/CropPdfTool';
import HtmlToPdfTool from './components/tools/HtmlToPdfTool';
import PdfToExcelTool from './components/tools/PdfToExcelTool';
import PdfToTextTool from './components/tools/PdfToTextTool';
import DeletePagesTool from './components/tools/DeletePagesTool';
import ImageToTextTool from './components/tools/ImageToTextTool';
import QrCodeGeneratorTool from './components/tools/QrCodeGeneratorTool';
import ImageEnlargerTool from './components/tools/ImageEnlargerTool';
import PdfToDocxTool from './components/tools/PdfToDocxTool';
import PanCroppingTool from './components/tools/PanCroppingTool';
import DesignedByFooter from './components/DesignedByFooter';
import type { Tool } from './types';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);

  const renderActiveTool = () => {
    if (!activeTool) return null;

    switch (activeTool.id) {
      case ToolId.RESIZE_IMAGE:
        return <ResizeImageTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.PDF_TO_IMAGE:
        return <ConvertPdfToImageTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.IMAGE_TO_PDF:
        return <ConvertImageToPdfTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.MERGE_IMAGE:
        return <MergeImageTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.COMPRESS_FILE:
        return <CompressTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.SMART_RENAME:
        return <SmartRenameTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.EDIT_PDF:
        return <EditPdfTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.SPLIT_PDF:
        return <SplitPdfTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.CROP_PDF:
        return <CropPdfTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.HTML_TO_PDF:
        return <HtmlToPdfTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.PDF_TO_EXCEL:
        return <PdfToExcelTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.PDF_TO_TEXT:
        return <PdfToTextTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.DELETE_PAGES:
        return <DeletePagesTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.IMAGE_TO_TEXT:
        return <ImageToTextTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.QR_CODE_GENERATOR:
        return <QrCodeGeneratorTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.IMAGE_ENLARGER:
        return <ImageEnlargerTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.PDF_TO_DOCX:
        return <PdfToDocxTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      case ToolId.PAN_CROPPING:
        return <PanCroppingTool tool={activeTool} onBack={() => setActiveTool(null)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {activeTool ? (
          renderActiveTool()
        ) : (
          <div>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">Free Online Docs & Image Editor</h1>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Effortlessly edit, convert, compress, resize, and merge your documents and images. Your free, all-in-one toolkit for PDF and image manipulation, powered by AI.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {TOOLS.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onSelect={() => setActiveTool(tool)} />
              ))}
            </div>
          </div>
        )}
      </main>
      <DesignedByFooter />
      <footer className="text-center py-6 text-slate-500 dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} Free Docs Editor AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;