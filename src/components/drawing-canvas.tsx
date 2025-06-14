
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Undo, Redo, Trash2, Palette, Dot } from 'lucide-react';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  initialPenColor?: string;
  initialPenSize?: number;
}

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;

export function DrawingCanvas({ 
  width = DEFAULT_WIDTH, 
  height = DEFAULT_HEIGHT,
  initialPenColor = '#000000',
  initialPenSize = 5,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState(initialPenColor);
  const [penSize, setPenSize] = useState(initialPenSize);
  
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const availableColors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'];

  const getContext = () => {
    const canvas = canvasRef.current;
    return canvas?.getContext('2d');
  };

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, historyStep + 1);
        newHistory.push(dataUrl);
        return newHistory;
      });
      setHistoryStep(prevStep => prevStep + 1);
    }
  }, [historyStep]);
  
  const loadFromHistory = useCallback((step: number) => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (canvas && ctx && history[step]) {
      const img = new Image();
      img.src = history[step];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  }, [history]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (canvas && ctx && history.length === 0) {
      // Set initial background for first history entry
      ctx.fillStyle = 'hsl(var(--card))'; // Or var(--background)
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveHistory();
    }
  }, [saveHistory, history.length]);


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
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
    saveHistory();
  };

  const getCoordinates = (event: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();
    if (event instanceof MouseEvent) {
      return { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    } else if (event.touches && event.touches[0]) {
      return { offsetX: event.touches[0].clientX - rect.left, offsetY: event.touches[0].clientY - rect.top };
    }
    return { offsetX: 0, offsetY: 0 };
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (canvas && ctx) {
      ctx.fillStyle = 'hsl(var(--card))';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveHistory();
    }
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 p-2 border rounded-md bg-muted">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Palette className="mr-2 h-4 w-4" /> Color
              <Dot className="ml-1 h-6 w-6" style={{ color: penColor }}/>
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
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2">
          <label htmlFor="penSize" className="text-sm">Size:</label>
          <Slider
            id="penSize"
            min={1}
            max={20}
            step={1}
            value={[penSize]}
            onValueChange={(value) => setPenSize(value[0])}
            className="w-32"
          />
          <span className="text-xs w-6 text-center">{penSize}</span>
        </div>
        
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyStep <= 0}>
            <Undo className="mr-2 h-4 w-4" /> Undo
            </Button>
            <Button variant="outline" size="sm" onClick={handleRedo} disabled={historyStep >= history.length - 1}>
            <Redo className="mr-2 h-4 w-4" /> Redo
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClearCanvas}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear
            </Button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing} // End drawing if mouse leaves canvas
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
        className="border rounded-md shadow-inner bg-card cursor-crosshair touch-none"
        style={{ width: `${width}px`, height: `${height}px` }} 
      />
    </div>
  );
}
