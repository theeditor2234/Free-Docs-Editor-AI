import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Tool } from '../../types';
import FileUploader from '../FileUploader';
import ToolContainer from '../ToolContainer';
import { removeImageBackground } from '../../services/geminiService';

// --- Types for edits ---
type EditToolType = 'select' | 'text' | 'rect' | 'draw' | 'signature' | 'checkmark' | 'image';

interface EditBase { id: string; x: number; y: number; }
interface TextEdit extends EditBase { type: 'text'; text: string; color: string; fontSize: number; }
interface RectEdit extends EditBase { type: 'rect'; width: number; height: number; color: string; }
interface DrawEdit extends EditBase { type: 'draw'; points: { x: number; y: number }[]; color: string; }
interface ImageEdit extends EditBase { type: 'image'; width: number; height: number; dataUrl: string; aspectRatio: number; }
type Edit = TextEdit | RectEdit | DrawEdit | ImageEdit;

// --- Toolbar Icons ---
const SelectIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-2.474m0 0l-2.51 2.225M13.684 16.6l2.474-2.225m0 0l2.51-2.224M16.158 14.375l-2.474 2.225m0 0l2.51 2.225m0 0l2.474-2.225M13.684 16.6l-2.474-2.225" /><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.75v6.75h6.75V3.75h-6.75zM3.75 14.25v6.75h6.75v-6.75H3.75z" /></svg>
const TextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const RectIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" /></svg>;
const DrawIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21H3v-3.5L15.232 5.232z" /></svg>;
const SignatureIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0l-1.5-1.5a2 2 0 010-2.828l3-3zM10 12a1 1 0 100-2 1 1 0 000 2z" /><path d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>;
const CheckmarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

const FONT_FAMILIES = ['Dancing Script', 'Caveat', 'Kalam', 'Permanent Marker'];

const SignatureModal: React.FC<{onClose: () => void, onSave: (dataUrl: string) => void}> = ({onClose, onSave}) => {
    const [mode, setMode] = useState<'draw' | 'type' | 'upload'>('draw');
    const drawCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const typeCanvasRef = useRef<HTMLCanvasElement>(null);
    const [typedText, setTypedText] = useState("Signature");
    const [selectedFont, setSelectedFont] = useState(FONT_FAMILIES[0]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
    const [signatureVariations, setSignatureVariations] = useState<{original: string, transparent: string | null} | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<'original' | 'transparentA' | 'transparentB' | null>(null);
    const checkerboardBg = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAACVJREFUOE9jZGBgEGHAD97/159h/H8Y/j+G/39G/H8Y/v8fAP8fAAD+BxHmFfgfAAAAAElFTSuQmCC')";

    const getCoords = (canvas: HTMLCanvasElement, e: React.MouseEvent | React.TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = drawCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        setIsDrawing(true);
        const {x, y} = getCoords(canvas, e);
        ctx.beginPath();
        ctx.moveTo(x,y);
    }
    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = drawCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const {x, y} = getCoords(canvas, e);
        ctx.lineTo(x,y);
        ctx.stroke();
    }
    const stopDrawing = () => setIsDrawing(false);
    const clearCanvas = () => {
        const canvas = drawCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if(canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    useEffect(() => {
        const canvas = typeCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `48px "${selectedFont}", cursive`;
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);
    }, [typedText, selectedFont, mode]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = async (event) => {
                const originalDataUrl = event.target?.result as string;
                setSignatureVariations({ original: originalDataUrl, transparent: null });
                setSelectedVariation('original');
                setIsGeneratingVariations(true);
                try {
                    const transparentDataUrl = await removeImageBackground(file);
                    setSignatureVariations({ original: originalDataUrl, transparent: `data:image/png;base64,${transparentDataUrl}` });
                    setSelectedVariation('transparentA');
                } catch (error) {
                    console.error(error);
                    alert((error as Error).message);
                } finally {
                    setIsGeneratingVariations(false);
                }
            };
            reader.readAsDataURL(file);
        }
    }

    const handleSave = () => {
        let dataUrl: string | undefined;
        if (mode === 'draw') dataUrl = drawCanvasRef.current?.toDataURL();
        else if (mode === 'type') dataUrl = typeCanvasRef.current?.toDataURL();
        else if (mode === 'upload' && signatureVariations) {
            if (selectedVariation === 'original') dataUrl = signatureVariations.original;
            else if (signatureVariations.transparent) dataUrl = signatureVariations.transparent;
        }
        if(dataUrl) onSave(dataUrl);
    }

    const TabButton: React.FC<{ currentMode: typeof mode; targetMode: typeof mode; children: React.ReactNode; }> = ({ currentMode, targetMode, children }) => (
        <button onClick={() => setMode(targetMode)} className={`px-4 py-2 text-sm font-semibold flex-1 transition-colors rounded-t-md ${currentMode === targetMode ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{children}</button>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl">
                <div className="p-6">
                    <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Create Signature</h3>
                    <div className="flex bg-slate-200 dark:bg-slate-900 rounded-t-lg">
                       <TabButton currentMode={mode} targetMode='draw'>Draw</TabButton>
                       <TabButton currentMode={mode} targetMode='type'>Type</TabButton>
                       <TabButton currentMode={mode} targetMode='upload'>Upload Image</TabButton>
                    </div>
                    <div className="bg-white dark:bg-slate-700 p-4 rounded-b-lg">
                        {mode === 'draw' && (
                            <div>
                                <canvas ref={drawCanvasRef} width="450" height="200" className="bg-slate-100 dark:bg-slate-600 rounded border border-slate-300 dark:border-slate-500 w-full cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}></canvas>
                                <button onClick={clearCanvas} className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">Clear</button>
                            </div>
                        )}
                        {mode === 'type' && (
                            <div className="flex flex-col gap-4">
                                <input type="text" value={typedText} onChange={e => setTypedText(e.target.value)} className="w-full text-center rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm" style={{ fontFamily: selectedFont, fontSize: '2rem' }} />
                                <select value={selectedFont} onChange={e => setSelectedFont(e.target.value)} className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm">
                                    {FONT_FAMILIES.map(font => <option key={font} value={font} style={{fontFamily: font}}>{font}</option>)}
                                </select>
                                <canvas ref={typeCanvasRef} width="450" height="150" className="hidden"></canvas>
                            </div>
                        )}
                        {mode === 'upload' && (
                           <div>
                                {!signatureVariations ? (
                                    <>
                                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                        <button onClick={() => fileInputRef.current?.click()} className="w-full p-4 border-2 border-dashed rounded-lg text-slate-500 hover:border-indigo-500 hover:text-indigo-500">
                                            Click to select an image
                                        </button>
                                    </>
                                ) : isGeneratingVariations ? (
                                    <div className="text-center p-8 flex flex-col items-center justify-center">
                                         <svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p>AI is making your signature transparent...</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mb-2">Choose an image version:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <button onClick={() => setSelectedVariation('original')} className={`p-2 border-2 rounded-lg transition-colors ${selectedVariation === 'original' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                                <div className="w-full h-24 flex items-center justify-center bg-slate-100 dark:bg-slate-600 rounded relative" style={{backgroundImage: checkerboardBg}}>
                                                    <img src={signatureVariations.original} alt="Original signature" className="max-h-full max-w-full" />
                                                    <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center text-white opacity-50">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-semibold mt-1">Original</p>
                                            </button>
                                            <button onClick={() => setSelectedVariation('transparentA')} className={`p-2 border-2 rounded-lg transition-colors ${selectedVariation === 'transparentA' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`} disabled={!signatureVariations.transparent}>
                                                <div className="w-full h-24 flex items-center justify-center bg-slate-100 dark:bg-slate-600 rounded" style={{backgroundImage: checkerboardBg}}>
                                                    {signatureVariations.transparent ? <img src={signatureVariations.transparent} alt="Transparent signature A" className="max-h-full max-w-full" /> : <p className="text-xs p-2">AI processing failed.</p>}
                                                </div>
                                                <p className="text-xs font-semibold mt-1">Transparent A</p>
                                            </button>
                                            <button onClick={() => setSelectedVariation('transparentB')} className={`p-2 border-2 rounded-lg transition-colors ${selectedVariation === 'transparentB' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`} disabled={!signatureVariations.transparent}>
                                                <div className="w-full h-24 flex items-center justify-center bg-slate-100 dark:bg-slate-600 rounded" style={{backgroundImage: checkerboardBg}}>
                                                    {signatureVariations.transparent ? <img src={signatureVariations.transparent} alt="Transparent signature B" className="max-h-full max-w-full" /> : <p className="text-xs p-2">AI processing failed.</p>}
                                                </div>
                                                <p className="text-xs font-semibold mt-1">Transparent B</p>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end mt-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-semibold">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold">Save Signature</button>
                </div>
            </div>
        </div>
    )
}

const SelectionControls: React.FC<{
    edit: Edit;
    onDelete: () => void;
}> = ({ edit, onDelete }) => {
    return (
        <div 
            className="absolute z-30 flex items-center gap-1 p-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600"
            style={{ 
                top: edit.y - 40, 
                left: edit.x + ('width' in edit ? edit.width / 2 : 0),
                transform: 'translateX(-50%)',
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button title="Delete" onClick={onDelete} className="p-1 rounded hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    );
};

const EditPdfTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<EditToolType>('select');
  const [edits, setEdits] = useState<Map<number, Edit[]>>(new Map());
  const [color, setColor] = useState('#FF0000');
  const [fontSize, setFontSize] = useState(16);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [placingObject, setPlacingObject] = useState<{type: 'signature' | 'image', dataUrl: string} | null>(null);
  const [checkmarkDataUrl, setCheckmarkDataUrl] = useState('');

  const [selectedEditId, setSelectedEditId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizeHandleBeingDragged = useRef<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const imageUploadInputRef = useRef<HTMLInputElement>(null);

  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const interactionCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentDrawing = useRef<DrawEdit | RectEdit | null>(null);
  const imageElements = useRef<Map<string, HTMLImageElement>>(new Map());
  const pdfPageScale = 1.5;

  useEffect(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    setCheckmarkDataUrl('data:image/svg+xml;base64,' + btoa(svg));
  }, [color]);

  const addEdit = (page: number, edit: Edit) => {
    setEdits(prev => {
      const newEdits = new Map<number, Edit[]>(prev);
      const pageEdits = newEdits.get(page) || [];
      newEdits.set(page, [...pageEdits, edit]);
      return newEdits;
    });
    return edit.id;
  };

  const drawEditsOnCanvas = useCallback((context: CanvasRenderingContext2D, scale = 1) => {
    const pageEdits = edits.get(currentPage) || [];
    pageEdits.forEach(edit => {
      context.fillStyle = 'color' in edit ? edit.color : '#000000';
      context.strokeStyle = 'color' in edit ? edit.color : '#000000';
      switch (edit.type) {
        case 'text':
          context.font = `${edit.fontSize * scale}px sans-serif`;
          context.fillText(edit.text, edit.x * scale, edit.y * scale);
          break;
        case 'rect':
          context.globalAlpha = 0.5;
          context.fillRect(edit.x * scale, edit.y * scale, edit.width * scale, edit.height * scale);
          context.globalAlpha = 1.0;
          break;
        case 'draw':
          context.beginPath();
          if (edit.points.length > 0) context.moveTo(edit.points[0].x * scale, edit.points[0].y * scale);
          edit.points.forEach(point => context.lineTo(point.x * scale, point.y * scale));
          context.lineWidth = 2 * scale;
          context.stroke();
          break;
        case 'image':
          const img = imageElements.current.get(edit.id);
          if (img && img.complete) {
            context.drawImage(img, edit.x * scale, edit.y * scale, edit.width * scale, edit.height * scale);
          }
          break;
      }
    });
  }, [edits, currentPage]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc) return;
    setIsProcessing(true);
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: pdfPageScale });

    const setupCanvas = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      return canvas.getContext('2d');
    };

    const pdfContext = setupCanvas(pdfCanvasRef.current);
    setupCanvas(interactionCanvasRef.current);
    
    if (pdfContext) {
      await page.render({ canvasContext: pdfContext, viewport }).promise;
    }
    setIsProcessing(false);
  }, [pdfDoc]);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
        try {
          const pdf = await (window as any).pdfjsLib.getDocument(typedarray).promise;
          setPdfDoc(pdf);
          setTotalPages(pdf.numPages);
          setCurrentPage(1);
          setEdits(new Map());
        } catch (error) {
          alert("Could not load PDF. It might be corrupted or password-protected.");
          setFile(null);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [file]);

  useEffect(() => { if (pdfDoc) renderPage(currentPage) }, [pdfDoc, currentPage, renderPage]);
  
  const redrawInteractionCanvas = useCallback(() => {
    const context = interactionCanvasRef.current?.getContext('2d');
    if (context) {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      drawEditsOnCanvas(context);

      if (selectedEditId) {
        const pageEdits: Edit[] = edits.get(currentPage) || [];
        const edit = pageEdits.find(e => e.id === selectedEditId);
        if (edit && ('width' in edit)) {
          context.strokeStyle = '#0a60ff';
          context.lineWidth = 2;
          context.setLineDash([6, 3]);
          context.strokeRect(edit.x, edit.y, edit.width, edit.height);
          context.setLineDash([]);
          
          // Draw resize handles
          const handleSize = 8;
          context.fillStyle = '#ffffff';
          context.lineWidth = 1;
          const handles = [
              { x: edit.x - handleSize/2, y: edit.y - handleSize/2 },
              { x: edit.x + edit.width - handleSize/2, y: edit.y - handleSize/2 },
              { x: edit.x - handleSize/2, y: edit.y + edit.height - handleSize/2 },
              { x: edit.x + edit.width - handleSize/2, y: edit.y + edit.height - handleSize/2 },
          ];
          handles.forEach(handle => {
              context.fillRect(handle.x, handle.y, handleSize, handleSize);
              context.strokeRect(handle.x, handle.y, handleSize, handleSize);
          });
        }
      }
    }
  }, [drawEditsOnCanvas, selectedEditId, edits, currentPage]);

  useEffect(() => { redrawInteractionCanvas() }, [edits, currentPage, redrawInteractionCanvas, selectedEditId]);

  useEffect(() => {
    const pageEdits: Edit[] = edits.get(currentPage) || [];
    pageEdits.forEach(edit => {
        if (edit.type === 'image' && !imageElements.current.has(edit.id)) {
            const img = new Image();
            img.onload = () => { imageElements.current.set(edit.id, img); redrawInteractionCanvas(); };
            img.src = edit.dataUrl;
        }
    });
  }, [edits, currentPage, redrawInteractionCanvas]);

  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = interactionCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getEditAtPosition = (x: number, y: number) => {
    const pageEditsFromMap: Edit[] = edits.get(currentPage) || [];
    const pageEdits = [...pageEditsFromMap].reverse();
    return pageEdits.find(edit => {
      if ('width' in edit) {
        return x >= edit.x && x <= edit.x + edit.width && y >= edit.y && y <= edit.y + edit.height;
      }
      return false; 
    });
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (placingObject) return;
    const { x, y } = getCanvasCoords(e);
    
    if (selectedEditId) {
      const pageEdits = edits.get(currentPage) || [];
      const edit = pageEdits.find(e => e.id === selectedEditId);
      if (edit && 'width' in edit) {
        const handleSize = 8;
        const corners = {
          nw: { x: edit.x, y: edit.y },
          ne: { x: edit.x + edit.width, y: edit.y },
          sw: { x: edit.x, y: edit.y + edit.height },
          se: { x: edit.x + edit.width, y: edit.y + edit.height },
        };
        const handleNames: (keyof typeof corners)[] = ['nw', 'ne', 'sw', 'se'];
        for (const handleName of handleNames) {
          const pos = corners[handleName];
          if (Math.hypot(x - pos.x, y - pos.y) < handleSize) {
            setIsResizing(true);
            resizeHandleBeingDragged.current = handleName;
            return;
          }
        }
      }
    }

    if (activeTool === 'select') {
      const clickedEdit = getEditAtPosition(x, y);
      if (clickedEdit) {
        setSelectedEditId(clickedEdit.id);
        setIsMoving(true);
        dragStartOffset.current = { x: x - clickedEdit.x, y: y - clickedEdit.y };
      } else {
        setSelectedEditId(null);
      }
      return;
    }
    
    isDrawing.current = true;
    if (activeTool === 'draw') currentDrawing.current = { id: Date.now().toString(), type: 'draw', points: [{ x, y }], x, y, color };
    else if (activeTool === 'rect') currentDrawing.current = { id: Date.now().toString(), type: 'rect', x, y, width: 0, height: 0, color };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    if (isResizing && selectedEditId) {
        setEdits(prev => {
            const newEdits = new Map<number, Edit[]>(prev);
            const pageEdits = newEdits.get(currentPage) || [];
            const updatedPageEdits = pageEdits.map(edit => {
                if (edit.id === selectedEditId && 'width' in edit) {
                    const newEdit = { ...edit };
                    const handle = resizeHandleBeingDragged.current;
                    const oldRight = edit.x + edit.width;
                    const oldBottom = edit.y + edit.height;

                    let newWidth = edit.width;
                    if (handle === 'se' || handle === 'ne') newWidth = x - edit.x;
                    else if (handle === 'sw' || handle === 'nw') newWidth = oldRight - x;
                    
                    if (newWidth > 10) {
                        const newHeight = edit.type === 'image' ? newWidth / edit.aspectRatio : (handle === 'se' || handle === 'sw' ? y - edit.y : oldBottom - y);
                        
                        if (newHeight > 10) {
                            if (handle === 'sw' || handle === 'nw') newEdit.x = oldRight - newWidth;
                            if (handle === 'nw' || handle === 'ne') newEdit.y = oldBottom - newHeight;
                            newEdit.width = newWidth;
                            newEdit.height = newHeight;
                        }
                    }
                    return newEdit;
                }
                return edit;
            });
            newEdits.set(currentPage, updatedPageEdits);
            return newEdits;
        });
        return;
    }
    if (isMoving && selectedEditId) {
      setEdits(prev => {
        const newEdits = new Map<number, Edit[]>(prev);
        const pageEdits: Edit[] = newEdits.get(currentPage) || [];
        const updatedPageEdits = pageEdits.map(edit => 
          edit.id === selectedEditId ? { ...edit, x: x - dragStartOffset.current.x, y: y - dragStartOffset.current.y } : edit
        );
        newEdits.set(currentPage, updatedPageEdits);
        return newEdits;
      });
      return;
    }

    if (!isDrawing.current || !currentDrawing.current) return;
    const context = interactionCanvasRef.current?.getContext('2d');
    if (!context) return;
    
    redrawInteractionCanvas();
    context.fillStyle = context.strokeStyle = color;
    context.globalAlpha = 0.5;

    if (currentDrawing.current.type === 'draw') {
      currentDrawing.current.points.push({ x, y });
      context.beginPath();
      context.moveTo(currentDrawing.current.points[0].x, currentDrawing.current.points[0].y);
      currentDrawing.current.points.forEach(p => context.lineTo(p.x, p.y));
      context.lineWidth = 2;
      context.stroke();
    } else if (currentDrawing.current.type === 'rect') {
      context.fillRect(currentDrawing.current.x, currentDrawing.current.y, x - currentDrawing.current.x, y - currentDrawing.current.y);
    }
    context.globalAlpha = 1.0;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsMoving(false);
    setIsResizing(false);
    resizeHandleBeingDragged.current = null;
    if (!isDrawing.current || !currentDrawing.current) return;
    isDrawing.current = false;
    const { x, y } = getCanvasCoords(e);
    if (currentDrawing.current.type === 'rect') {
      currentDrawing.current.width = x - currentDrawing.current.x;
      currentDrawing.current.height = y - currentDrawing.current.y;
      if (currentDrawing.current.width < 0) {
        currentDrawing.current.x += currentDrawing.current.width;
        currentDrawing.current.width *= -1;
      }
      if (currentDrawing.current.height < 0) {
        currentDrawing.current.y += currentDrawing.current.height;
        currentDrawing.current.height *= -1;
      }
    }
    addEdit(currentPage, currentDrawing.current);
    currentDrawing.current = null;
  };
  
  const handleCanvasClick = (e: React.MouseEvent) => {
     const { x, y } = getCanvasCoords(e);
    if (activeTool === 'text') {
      const text = prompt("Enter text:");
      if (text) addEdit(currentPage, { id: Date.now().toString(), type: 'text', x, y, text, color, fontSize });
    } else if (activeTool === 'checkmark') {
        const size = 20;
        addEdit(currentPage, { id: Date.now().toString(), type: 'image', x: x - size/2, y: y - size/2, width: size, height: size, dataUrl: checkmarkDataUrl, aspectRatio: 1 });
    } else if (placingObject) {
        const img = new Image();
        img.onload = () => {
            const aspectRatio = img.width / img.height;
            const width = placingObject.type === 'signature' ? 150 : 200;
            const height = width / aspectRatio;
            const newId = addEdit(currentPage, { id: Date.now().toString(), type: 'image', x: x - width/2, y: y-height/2, width, height, dataUrl: placingObject.dataUrl, aspectRatio });
            setPlacingObject(null);
            setActiveTool('select');
            setSelectedEditId(newId);
        };
        img.src = placingObject.dataUrl;
    }
  };

  const handleSaveSignature = (dataUrl: string) => {
    setShowSignatureModal(false);
    setPlacingObject({type: 'signature', dataUrl});
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setPlacingObject({ type: 'image', dataUrl: event.target?.result as string });
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  const handleDeleteSelected = () => {
    if (!selectedEditId) return;
    setEdits(prev => {
        const newEdits = new Map<number, Edit[]>(prev);
        const pageEdits: Edit[] = (newEdits.get(currentPage) || []).filter(e => e.id !== selectedEditId);
        newEdits.set(currentPage, pageEdits);
        return newEdits;
    });
    setSelectedEditId(null);
  }

  const handleSave = async () => {
    if (!pdfDoc || !file) return;
    setIsProcessing(true);
    const { jsPDF } = (window as any).jspdf;
    
    const firstPageForSize = await pdfDoc.getPage(1);
    const viewportForSize = firstPageForSize.getViewport({ scale: 1 });
    const orientation = viewportForSize.width > viewportForSize.height ? 'l' : 'p';
    const doc = new jsPDF({ orientation, unit: 'pt', format: [viewportForSize.width, viewportForSize.height] });
    doc.deletePage(1);

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      doc.addPage([viewport.width, viewport.height], orientation);
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;
      await page.render({ canvasContext: tempCtx, viewport }).promise;
      drawEditsOnCanvas(tempCtx, 1 / pdfPageScale);
      doc.addImage(tempCanvas.toDataURL('image/png'), 'PNG', 0, 0, viewport.width, viewport.height);
    }
    doc.save(`edited-${file.name}`);
    setIsProcessing(false);
  };
  
  const ToolButton: React.FC<{ type: EditToolType, icon?: React.ReactNode, action?: () => void, children: React.ReactNode }> = ({ type, icon, children, action }) => (
    <button
      onClick={() => {
        setPlacingObject(null);
        setSelectedEditId(null);
        if (action) action();
        else setActiveTool(type);
      }}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
        (activeTool === type && !placingObject)
          ? 'bg-indigo-600 text-white shadow'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
      }`}
    >
        {icon}
        {children}
    </button>
  );

  return (
    <ToolContainer tool={tool} onBack={onBack}>
      {showSignatureModal && <SignatureModal onClose={() => setShowSignatureModal(false)} onSave={handleSaveSignature} />}
      {!file ? (
        <FileUploader onFileSelect={(f) => setFile(f as File)} accept={tool.accept} />
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
            <ToolButton type="select" icon={<SelectIcon />}>Select</ToolButton>
            <ToolButton type="draw" icon={<DrawIcon />}>Draw</ToolButton>
            <ToolButton type="text" icon={<TextIcon />}>Text</ToolButton>
            <ToolButton type="checkmark" icon={<CheckmarkIcon />}>Check</ToolButton>
            <ToolButton type="rect" icon={<RectIcon />}>Shape</ToolButton>
            <ToolButton type="image" icon={<ImageIcon />} action={() => imageUploadInputRef.current?.click()}>Image</ToolButton>
            <ToolButton type="signature" icon={<SignatureIcon />} action={() => setShowSignatureModal(true)}>Signature</ToolButton>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 w-9 p-0.5 border-none rounded bg-transparent cursor-pointer" title="Select color" />
            {activeTool === 'text' && (
              <input type="number" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value) || 16)} className="w-20 rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm sm:text-sm" title="Font size" />
            )}
            <input type="file" accept="image/*" ref={imageUploadInputRef} onChange={handleImageUpload} className="hidden" />
          </div>

          <div 
            className="relative mx-auto w-fit max-w-full overflow-auto bg-slate-200 dark:bg-slate-600 shadow-lg" 
            style={{ cursor: isResizing ? 'crosshair' : isMoving ? 'grabbing' : (activeTool === 'select' ? 'default' : 'crosshair') }}>
            <canvas ref={pdfCanvasRef} className="block" />
            <canvas ref={interactionCanvasRef} className="absolute top-0 left-0 z-10" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={handleCanvasClick} />
            {isProcessing && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-20"><p>Loading...</p></div>}
            {placingObject && <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center z-20 pointer-events-none"><p className="text-indigo-800 dark:text-indigo-200 font-bold bg-white/50 dark:bg-black/50 p-2 rounded">Click to place {placingObject.type}</p></div>}
            {selectedEditId && (
                <SelectionControls
                    edit={((edits.get(currentPage) || []) as Edit[]).find(e => e.id === selectedEditId)!}
                    onDelete={handleDeleteSelected}
                />
            )}
          </div>

          <div className="flex justify-center items-center gap-4 mt-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50 font-semibold">Prev</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50 font-semibold">Next</button>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={handleSave} disabled={isProcessing} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300">
              {isProcessing ? 'Saving...' : 'Save & Download PDF'}
            </button>
             <button onClick={() => {setFile(null); setPlacingObject(null);}} className="w-full text-center text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-500 py-3 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                Use another file
            </button>
          </div>
        </div>
      )}
    </ToolContainer>
  );
};

export default EditPdfTool;