import { ReactNode } from 'react';

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export default function Dropdown({ isOpen, onClose, children, className = '' }: DropdownProps) {
  if (!isOpen) return null;

  return (
    <div className="relative">
      {/* Overlay to capture clicks outside */}
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />
      
      {/* Dropdown content */}
      <div 
        className={`fixed border border-[var(--border-color)] rounded shadow-lg overflow-hidden ${className}`}
        style={{ 
          backgroundColor: 'var(--editor-bg)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          position: 'absolute',
          zIndex: 2
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[var(--editor-bg)]">
          {children}
        </div>
      </div>
    </div>
  );
} 