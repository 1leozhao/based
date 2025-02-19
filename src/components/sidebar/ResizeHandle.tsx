import React from 'react';

interface ResizeHandleProps {
  onResizeStart: (e: React.MouseEvent) => void;
}

export default function ResizeHandle({ onResizeStart }: ResizeHandleProps) {
  return (
    <div
      className="absolute top-0 right-0 bottom-0 w-[2px] cursor-col-resize hover:bg-[var(--primary-color)] bg-[var(--border-color)] transition-colors"
      onMouseDown={onResizeStart}
    />
  );
} 