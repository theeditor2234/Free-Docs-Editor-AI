import React from 'react';
import type { Tool } from './types';

export enum ToolId {
  RESIZE_IMAGE,
  PDF_TO_IMAGE,
  IMAGE_TO_PDF,
  MERGE_IMAGE,
  COMPRESS_FILE,
  SMART_RENAME,
  EDIT_PDF,
  SPLIT_PDF,
  CROP_PDF,
  HTML_TO_PDF,
  PDF_TO_EXCEL,
  PDF_TO_TEXT,
  DELETE_PAGES,
  IMAGE_TO_TEXT,
  QR_CODE_GENERATOR,
  IMAGE_ENLARGER,
  PDF_TO_DOCX,
  PAN_CROPPING,
}

const CompressIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
  </svg>
);

const ResizeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" transform="rotate(45 12 12)" />
    </svg>
);

const MergeIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4zM12 6v12" />
  </svg>
);

const PdfToImageIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11h6m-3-3v6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ImageToPdfIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const AiIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 16v-2m0-10v2m0 6v2M6 12H4m16 0h-2m-10 0h2m6 0h2M9 15l-2 2m10-10l-2 2m0 6l2 2m-10-10l2-2" />
    </svg>
);

const EditIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21H3v-3.5L15.232 5.232z" />
    </svg>
);

const SplitIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-4.879-4.879L4 4m15 0l-4.879 4.879M4 19l4.879-4.879" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2M3 12h2m14 0h2" />
    </svg>
);

const CropIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H4v-4m16 4h-4v-4M8 8H4v4m16-4h-4v4" />
    </svg>
);

const PanCropIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v2m8-2v2M3 12h2m14 0h2" />
    </svg>
);

const HtmlIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);

const ExcelIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM3 10h18M10 3v18" />
    </svg>
);

const TextIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const DeleteIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const OcrIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 11V7a1 1 0 011-1h2a1 1 0 011 1v4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 11h4" />
    </svg>
);

const QrCodeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M8 8H4v4h4V8zm8 8h4v4h-4v-4zM8 16H4v4h4v-4zm8-8h4v4h-4V8zM8 4H4v4h4V4zm8 12h4v4h-4v-4z" />
    </svg>
);

const EnlargeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
    </svg>
);

const DocxIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-5.45-8.342L12 12.253l5.45-4.842" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
    </svg>
);

export const TOOLS: Tool[] = [
    {
        id: ToolId.PAN_CROPPING,
        title: 'Photo & Signature Resizer',
        description: 'Resize photos and signatures to specific pixel dimensions and DPI values for online applications.',
        icon: <PanCropIcon />,
        accept: 'image/jpeg,image/png,image/webp',
        category: 'Image',
    },
    {
        id: ToolId.RESIZE_IMAGE,
        title: 'Resize Image',
        description: 'Quickly resize images for any application, like SSC or JKSSB requirements.',
        icon: <ResizeIcon />,
        accept: 'image/jpeg,image/png,image/webp',
        category: 'Image',
    },
    {
        id: ToolId.PDF_TO_IMAGE,
        title: 'PDF to Image',
        description: 'Convert each page of a PDF into a high-quality JPG or PNG image.',
        icon: <PdfToImageIcon />,
        accept: 'application/pdf',
        category: 'PDF',
    },
    {
        id: ToolId.IMAGE_TO_PDF,
        title: 'Image to PDF',
        description: 'Combine multiple images into a single, easy-to-share PDF document.',
        icon: <ImageToPdfIcon />,
        accept: 'image/jpeg,image/png,image/webp',
        category: 'Image',
    },
    {
        id: ToolId.MERGE_IMAGE,
        title: 'Merge Images',
        description: 'Combine two images side-by-side into a single image or PDF.',
        icon: <MergeIcon />,
        accept: 'image/jpeg,image/png,image/webp',
        category: 'Image',
    },
    {
        id: ToolId.COMPRESS_FILE,
        title: 'Compress PDF',
        description: 'Reduce the file size of your PDF while maintaining optimal quality.',
        icon: <CompressIcon />,
        accept: 'application/pdf',
        category: 'PDF',
    },
    {
        id: ToolId.SMART_RENAME,
        title: 'AI Smart Rename',
        description: 'Let AI analyze your image and suggest a descriptive, SEO-friendly filename.',
        icon: <AiIcon />,
        accept: 'image/jpeg,image/png,image/webp',
        category: 'AI Tools',
    },
    {
        id: ToolId.EDIT_PDF,
        title: 'Edit PDF',
        description: 'Add text, shapes, signatures, and images directly to your PDF documents.',
        icon: <EditIcon />,
        accept: 'application/pdf',
        category: 'PDF',
    },
    {
        id: ToolId.SPLIT_PDF,
        title: 'Split PDF',
        description: 'Extract specific pages from a PDF or save each page as a separate file.',
        icon: <SplitIcon />,
        accept: 'application/pdf',
        category: 'PDF',
    },
    {
        id: ToolId.CROP_PDF,
        title: 'Crop PDF',
        description: 'Visually select an area to crop on one or all pages of your PDF.',
        icon: <CropIcon />,
        accept: 'application/pdf',
        category: 'PDF',
    },
    {
        id: ToolId.HTML_TO_PDF,
        title: 'HTML to PDF',
        description: 'Convert a webpage or HTML file into a perfectly formatted PDF document.',
        icon: <HtmlIcon />,
        accept: 'text/html',
        category: 'PDF',
    },
    {
        id: ToolId.PDF_TO_EXCEL,
        title: 'AI PDF to Excel',
        description: 'Use AI to accurately extract tabular data from your PDF into a CSV file.',
        icon: <ExcelIcon />,
        accept: 'application/pdf',
        category: 'AI Tools',
    },
    {
        id: ToolId.PDF_TO_TEXT,
        title: 'PDF to Text',
        description: 'Extract all text content from a PDF document into a simple .txt file.',
        icon: <TextIcon />,
        accept: 'application/pdf',
        category: 'PDF',
    },
    {
        id: ToolId.DELETE_PAGES,
        title: 'Delete PDF Pages',
        description: 'Easily remove one or more unwanted pages from your PDF document.',
        icon: <DeleteIcon />,
        accept: 'application/pdf',
        category: 'PDF',
    },
    {
        id: ToolId.IMAGE_TO_TEXT,
        title: 'AI Image to Text (OCR)',
        description: 'Perform OCR on any image to extract text with high accuracy, powered by AI.',
        icon: <OcrIcon />,
        accept: 'image/jpeg,image/png,image/webp',
        category: 'AI Tools',
    },
    {
        id: ToolId.QR_CODE_GENERATOR,
        title: 'QR Code Generator',
        description: 'Create custom QR codes for URLs, text, and more with color and size options.',
        icon: <QrCodeIcon />,
        accept: '',
        category: 'Image',
    },
    {
        id: ToolId.IMAGE_ENLARGER,
        title: 'Image Enlarger',
        description: 'Upscale your images by 2x or 4x without losing quality using smart algorithms.',
        icon: <EnlargeIcon />,
        accept: 'image/jpeg,image/png,image/webp',
        category: 'Image',
    },
    {
        id: ToolId.PDF_TO_DOCX,
        title: 'AI PDF to DOCX',
        description: 'Convert your PDF to a structured Markdown file using AI, ready for editing.',
        icon: <DocxIcon />,
        accept: 'application/pdf',
        category: 'AI Tools',
    },
];