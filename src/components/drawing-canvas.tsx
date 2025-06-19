

"use client";

import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Undo, Redo, Trash2, Palette, Dot } from 'lucide-react';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  initialPenColor?: string;
  initialPenSize?: number;
  initialDataUrl?: string | null;
  onCanvasChange?: (dataUrl: string) => void;
}

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;

export interface DrawingCanvasRef {
  toDataURL: (type?: string, quality?: any) => string | null;
  clearAndLoadDataUrl: (dataUrl: string | null) => void;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  (
    { 
      width = DEFAULT_WIDTH, 
      height = DEFAULT_HEIGHT,
      initialPenColor = '#000000',
      initialPenSize = 5,
      initialDataUrl = null,
      onCanvasChange,
    },
    forwardedRef
  ) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [penColor, setPenColor] = useState(initialPenColor);
    const [penSize, setPenSize] = useState(initialPenSize);
    
    const [history, setHistory] = useState<string[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    const availableColors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'];

    const getContext = useCallback(() => {
      const canvas = internalCanvasRef.current;
      return canvas?.getContext('2d');
    }, []);

    const clearAndDrawImage = useCallback((dataUrl: string) => {
      const canvas = internalCanvasRef.current;
      const ctx = getContext();
      if (canvas && ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.fillStyle = 'hsl(var(--card))'; 
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const currentCanvasData = canvas.toDataURL();
          setHistory([currentCanvasData]);
          setHistoryStep(0);
          if (onCanvasChange) onCanvasChange(currentCanvasData);
        };
        img.onerror = () => {
          ctx.fillStyle = 'hsl(var(--card))';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const currentCanvasData = canvas.toDataURL();
          setHistory([currentCanvasData]);
          setHistoryStep(0);
          if (onCanvasChange) onCanvasChange(currentCanvasData);
        }
        img.src = dataUrl;
      }
    }, [getContext, onCanvasChange]);
    
    const initializeCanvas = useCallback(() => {
      const canvas = internalCanvasRef.current;
      const ctx = getContext();
      if (canvas && ctx) {
        ctx.fillStyle = 'hsl(var(--card))'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const initialCanvasState = canvas.toDataURL();
        setHistory([initialCanvasState]);
        setHistoryStep(0);
        if (onCanvasChange) onCanvasChange(initialCanvasState);
      }
    }, [getContext, onCanvasChange]);

    useEffect(() => {
      if (initialDataUrl) {
        clearAndDrawImage(initialDataUrl);
      } else {
        initializeCanvas();
      }
    }, [initialDataUrl, initializeCanvas, clearAndDrawImage]);

    const saveHistoryEntry = useCallback(() => {
      const canvas = internalCanvasRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL();
        setHistory(prevHistory => {
          const newHistory = prevHistory.slice(0, historyStep + 1);
          newHistory.push(dataUrl);
          return newHistory;
        });
        setHistoryStep(prevStep => prevStep + 1);
        if (onCanvasChange) onCanvasChange(dataUrl);
      }
    }, [historyStep, onCanvasChange]);
    
    const loadFromHistory = useCallback((step: number) => {
      const canvas = internalCanvasRef.current;
      const ctx = getContext();
      if (canvas && ctx && history[step]) {
        const img = new Image();
        img.src = history[step];
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          if (onCanvasChange && history[step]) onCanvasChange(history[step]);
        };
      }
    }, [history, getContext, onCanvasChange]);

    const startDrawing = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
      const ctx = getContext();
      if (!ctx) return;

      const { offsetX, offsetY } = getCoordinates(nativeEvent);
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      setIsDrawing(true);
    };

    const draw = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      const ctx = getContext();
      if (!ctx) return;

      const { offsetX, offsetY } = getCoordinates(nativeEvent);
      ctx.lineTo(offsetX, offsetY);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };

    const endDrawing = () => {
      const ctx = getContext();
      if (!ctx || !isDrawing) return;
      ctx.closePath();
      setIsDrawing(false);
      saveHistoryEntry();
    };

    const getCoordinates = (event: MouseEvent | TouchEvent) => {
      const canvas = internalCanvasRef.current;
      if (!canvas) return { offsetX: 0, offsetY: 0 };
      const rect = canvas.getBoundingClientRect();
      if (event instanceof MouseEvent) {
        return { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
      } else if ('touches' in event && event.touches && event.touches[0]) {
        return { offsetX: event.touches[0].clientX - rect.left, offsetY: event.touches[0].clientY - rect.top };
      }
      return { offsetX: 0, offsetY: 0 };
    };

    const handleClearCanvas = () => {
      initializeCanvas();
    };

    const handleUndo = () => {
      if (historyStep > 0) {
        const newStep = historyStep - 1;
        setHistoryStep(newStep);
        loadFromHistory(newStep);
      }
    };

    const handleRedo = () => {
      if (historyStep < history.length - 1) {
        const newStep = historyStep + 1;
        setHistoryStep(newStep);
        loadFromHistory(newStep);
      }
    };
    
    useImperativeHandle(forwardedRef, () => ({
      toDataURL: (type?: string, quality?: any) => {
        const canvas = internalCanvasRef.current;
        return canvas ? canvas.toDataURL(type, quality) : null;
      },
      clearAndLoadDataUrl: (dataUrl: string | null) => {
          if (dataUrl) {
              clearAndDrawImage(dataUrl);
          } else {
              initializeCanvas();
          }
      }
    }));

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 p-2 border rounded-md bg-muted">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Select pen color">
                <Palette className="mr-2 h-4 w-4" aria-hidden="true" /> Color
                <Dot className="ml-1 h-6 w-6" style={{ color: penColor }} aria-hidden="true"/>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-4 gap-1">
                {availableColors.map(color => (
                  <Button
                    key={color}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    style={{ backgroundColor: color }}
                    onClick={() => setPenColor(color)}
                    aria-label={`Select color ${color === '#FFFFFF' ? 'white' : color === '#000000' ? 'black' : color}`}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2">
            <Label htmlFor="penSize" className="text-sm sr-only">Pen Size:</Label>
            <Slider
              id="penSize"
              aria-label="Pen size"
              min={1}
              max={20}
              step={1}
              value={[penSize]}
              onValueChange={(value) => setPenSize(value[0])}
              className="w-32"
            />
            <span className="text-xs w-6 text-center" aria-live="polite">{penSize}px</span>
          </div>
          
          <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyStep <= 0} aria-label="Undo last stroke">
              <Undo className="mr-2 h-4 w-4" aria-hidden="true" /> Undo
              </Button>
              <Button variant="outline" size="sm" onClick={handleRedo} disabled={historyStep >= history.length - 1} aria-label="Redo last undone stroke">
              <Redo className="mr-2 h-4 w-4" aria-hidden="true" /> Redo
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClearCanvas} aria-label="Clear canvas">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Clear
              </Button>
          </div>
        </div>
        <canvas
          ref={internalCanvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="border rounded-md shadow-inner bg-card cursor-crosshair touch-none"
          style={{ width: `${width}px`, height: `${height}px` }} 
          aria-label="Drawing canvas"
        />
      </div>
    );
  }
);
DrawingCanvas.displayName = "DrawingCanvas";

export { DrawingCanvas };
