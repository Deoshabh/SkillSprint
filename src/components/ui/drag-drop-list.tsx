"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";

export interface DraggableItem {
  id: string;
  [key: string]: any;
}

export interface DragDropListProps<T extends DraggableItem> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onReorder: (items: T[]) => void;
  className?: string;
  dragHandleClassName?: string;
}

export function DragDropList<T extends DraggableItem>({
  items,
  renderItem,
  onReorder,
  className,
  dragHandleClassName,
}: DragDropListProps<T>) {
  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    onReorder(newItems);
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      moveItem(index, index - 1);
    }
  };

  const moveDown = (index: number) => {
    if (index < items.length - 1) {
      moveItem(index, index + 1);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="flex items-start gap-2">
          <div className={cn("flex flex-col items-center self-stretch justify-center px-1", dragHandleClassName)}>
            <button 
              type="button"
              className="p-1 hover:bg-muted rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => moveUp(index)}
              disabled={index === 0}
              aria-label="Move up"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <GripVertical className="h-4 w-4 text-muted-foreground my-1" />
            <button 
              type="button"
              className="p-1 hover:bg-muted rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => moveDown(index)}
              disabled={index === items.length - 1}
              aria-label="Move down"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1">
            {renderItem(item, index)}
          </div>
        </div>
      ))}
    </div>
  );
}
