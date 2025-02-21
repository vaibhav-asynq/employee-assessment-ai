"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api';

interface ExtractedTextItem {
  text: string;
  originalText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
}

// Initialize PDF.js worker
// Use CDN worker for now to rule out local worker issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface EditablePDFViewerProps {
  pdfUrl: string;
  onContentChange?: (content: string) => void;
}

export function EditablePDFViewer({ pdfUrl, onContentChange }: EditablePDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textItems, setTextItems] = useState<ExtractedTextItem[]>([]);
  const [scale, setScale] = useState(1.5);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);

  // Load PDF document only when URL changes
  useEffect(() => {
    let isMounted = true;

    const loadPDFDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Loading PDF document from:', pdfUrl);

        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        if (isMounted) {
          pdfDocRef.current = pdf;
          await renderPage();
        }
      } catch (error) {
        console.error('Error loading PDF document:', error);
        if (isMounted) {
          setError(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      }
    };

    loadPDFDocument();

    return () => {
      isMounted = false;
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [pdfUrl]);

  // Render page when scale changes
  const renderPage = async () => {
    if (!canvasRef.current || !pdfDocRef.current) return;

    try {
      const page = await pdfDocRef.current.getPage(1);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page
      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      // Extract text content
      const textContent = await page.getTextContent();
      const extractedTextItems: ExtractedTextItem[] = textContent.items.map((item: any) => {
        const transform = item.transform;
        const x = transform[4] * scale;
        const y = viewport.height - (transform[5] * scale); // Flip y coordinate
        const width = Math.abs(item.width * scale);
        const height = Math.abs(item.height || (transform[0] * 1.2)) * scale;
        const fontSize = Math.abs(transform[0] * scale);
        
        return {
          text: item.str,
          originalText: item.str,
          x,
          y,
          width,
          height,
          fontSize,
          fontFamily: item.fontName || 'Arial',
        };
      });

      setTextItems(extractedTextItems);
      setIsLoading(false);
    } catch (error) {
      console.error('Error rendering page:', error);
      setError(`Failed to render PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  // Re-render when scale changes
  useEffect(() => {
    if (pdfDocRef.current) {
      renderPage();
    }
  }, [scale]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[900px] border rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[900px] border rounded-lg">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const handleTextChange = (index: number, newText: string) => {
    const newTextItems = [...textItems];
    newTextItems[index] = { ...newTextItems[index], text: newText };
    setTextItems(newTextItems);

    if (onContentChange) {
      const content = newTextItems.map(item => item.text).join(' ');
      onContentChange(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Escape') {
      const newTextItems = [...textItems];
      newTextItems[index] = { 
        ...newTextItems[index], 
        text: newTextItems[index].originalText 
      };
      setTextItems(newTextItems);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <button
          onClick={handleZoomOut}
          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          disabled={scale <= 0.5}
        >
          Zoom Out
        </button>
        <span className="text-sm text-gray-600">{Math.round(scale * 100)}%</span>
        <button
          onClick={handleZoomIn}
          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          disabled={scale >= 3}
        >
          Zoom In
        </button>
        <button
          onClick={() => setShowDebugOverlay(!showDebugOverlay)}
          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded ml-4"
        >
          {showDebugOverlay ? 'Hide' : 'Show'} Debug Overlay
        </button>
      </div>
      <div className="relative border rounded-lg overflow-auto">
        <canvas ref={canvasRef} className="block" />
        <div 
          className="absolute top-0 left-0 w-full h-full" 
          style={{ pointerEvents: 'none' }}
        >
          {/* Debug overlay to show text positions */}
          {showDebugOverlay && textItems.map((item, index) => (
            <div
              key={`debug-${index}`}
              style={{
                position: 'absolute',
                left: `${item.x}px`,
                top: `${item.y}px`,
                width: `${item.width}px`,
                height: `${item.height}px`,
                border: '1px solid rgba(255, 0, 0, 0.2)',
                pointerEvents: 'none',
              }}
            />
          ))}
          {textItems.map((item, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${item.x}px`,
                top: `${item.y}px`,
                width: `${item.width}px`,
                minHeight: `${item.height}px`,
                fontSize: `${item.fontSize}px`,
                fontFamily: item.fontFamily,
                pointerEvents: 'auto',
                cursor: 'text',
                transform: 'translateY(-100%)', // Move text up to align with PDF content
              }}
            >
              <div
                contentEditable
                suppressContentEditableWarning
                className="outline-none hover:bg-blue-100/50 focus:bg-blue-100/50 transition-colors px-1 -mx-1 rounded"
                onInput={(e) => handleTextChange(index, e.currentTarget.textContent || '')}
                onKeyDown={(e) => handleKeyDown(e, index)}
                style={{
                  minHeight: `${item.height}px`,
                  lineHeight: `${item.height}px`,
                  whiteSpace: 'pre', // Preserve spaces
                  textAlign: 'left',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', // More opaque background
                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)', // Subtle border
                }}
              >
                {item.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
