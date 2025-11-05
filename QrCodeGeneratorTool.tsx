import React, { useState, useEffect, useCallback } from 'react';
import type { Tool } from '../../types';
import ToolContainer from '../ToolContainer';

declare global {
  interface Window {
    QRCode: any;
  }
}

const QrCodeGeneratorTool: React.FC<{ tool: Tool; onBack: () => void }> = ({ tool, onBack }) => {
  const [text, setText] = useState('https://aistudio.google.com/');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Customization State
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#FFFFFF');
  const [width, setWidth] = useState(300);
  const [margin, setMargin] = useState(1);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg' | 'svg'>('png');
  
  const generateQrCode = useCallback(() => {
    if (!text.trim()) {
      setQrCodeUrl(null);
      setQrCodeSvg(null);
      return;
    }
    
    if (typeof window.QRCode === 'undefined') {
        setError("QR Code library not loaded. Please check your connection and refresh.");
        return;
    }

    setIsProcessing(true);
    setError(null);
    
    const options = {
      errorCorrectionLevel,
      margin,
      width,
      scale: 4,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    };
    
    // Generate for image preview (PNG/JPEG)
    window.QRCode.toDataURL(text, { ...options, type: 'image/png' }, (err: any, generatedUrl: string) => {
        if (err) {
            console.error(err);
            setError("Could not generate QR code. The input text might be too long for the selected error correction level.");
            setQrCodeUrl(null);
        } else {
            setQrCodeUrl(generatedUrl);
        }
        setIsProcessing(false);
    });

    // Generate SVG for download option
    window.QRCode.toString(text, { ...options, type: 'svg' }, (err: any, generatedSvg: string) => {
        if (!err) {
            setQrCodeSvg(generatedSvg);
        }
    });

  }, [text, darkColor, lightColor, width, margin, errorCorrectionLevel]);

  // Debounced effect for generation
  useEffect(() => {
    const handler = setTimeout(() => {
      generateQrCode();
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [generateQrCode]);
  
  // Initial check for QR Code library
  useEffect(() => {
    if (typeof window.QRCode === 'undefined') {
       setError("QR Code library failed to load. Please check your network or ad-blocker.");
    }
  }, []);

  const handleDownload = () => {
    if (outputFormat === 'svg' && qrCodeSvg) {
        const blob = new Blob([qrCodeSvg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'qrcode.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else if (qrCodeUrl) {
        const options = {
            errorCorrectionLevel, margin, width,
            color: { dark: darkColor, light: lightColor },
            type: `image/${outputFormat}` as 'image/png' | 'image/jpeg',
            quality: 0.95,
        };
        window.QRCode.toDataURL(text, options, (err: any, url: string) => {
            if (err) return alert("Failed to generate download file.");
            const link = document.createElement('a');
            link.href = url;
            link.download = `qrcode.${outputFormat}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
  };

  const Option: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        {children}
    </div>
  );

  return (
    <ToolContainer tool={tool} onBack={onBack}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Left Panel: Options --- */}
        <div className="lg:col-span-1 space-y-6">
            <Option label="Content">
                <textarea
                    rows={4} value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Enter a website URL, plain text, etc."
                    className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm"
                />
            </Option>
            <div className="grid grid-cols-2 gap-4">
                <Option label="Foreground">
                    <input type="color" value={darkColor} onChange={(e) => setDarkColor(e.target.value)} className="w-full h-10 rounded-md p-1 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                </Option>
                <Option label="Background">
                    <input type="color" value={lightColor} onChange={(e) => setLightColor(e.target.value)} className="w-full h-10 rounded-md p-1 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                </Option>
            </div>
            <Option label={`Size: ${width}px`}>
                <input type="range" min="128" max="1024" step="8" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer" />
            </Option>
            <Option label="Margin">
                 <input type="number" min="0" max="20" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm" />
            </Option>
             <Option label="Error Correction">
                <select value={errorCorrectionLevel} onChange={(e) => setErrorCorrectionLevel(e.target.value as 'L'|'M'|'Q'|'H')} className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm">
                    <option value="L">Low (7%)</option>
                    <option value="M">Medium (15%)</option>
                    <option value="Q">Quartile (25%)</option>
                    <option value="H">High (30%)</option>
                </select>
            </Option>
        </div>

        {/* --- Right Panel: Preview & Download --- */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900/50 p-6 rounded-lg min-h-[400px]">
            {error && (
                <p className="text-red-500 text-center max-w-sm">{error}</p>
            )}
            
            {isProcessing && !qrCodeUrl && (
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-indigo-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="mt-2 font-semibold">Generating...</p>
                </div>
            )}
            
            {qrCodeUrl ? (
                <div className="text-center w-full">
                    <div className="flex justify-center bg-white p-4 rounded-lg shadow-inner w-fit mx-auto" style={{background: lightColor}}>
                        <img src={qrCodeUrl} alt="Generated QR Code" width="256" height="256" />
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <select value={outputFormat} onChange={e => setOutputFormat(e.target.value as any)} className="sm:flex-1 w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm">
                             <option value="png">PNG</option>
                             <option value="jpeg">JPEG</option>
                             <option value="svg">SVG</option>
                        </select>
                        <button 
                            onClick={handleDownload}
                            className="sm:flex-1 bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Download
                        </button>
                    </div>
                </div>
            ) : !isProcessing && !error ? (
                <p className="text-slate-500">Your QR code will appear here.</p>
            ) : null}
        </div>
      </div>
    </ToolContainer>
  );
};

export default QrCodeGeneratorTool;