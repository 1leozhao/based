'use client';

import { useState, useRef, useEffect } from 'react';

interface BaseMenuItem {
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  divider?: boolean;
}

interface MenuItemWithLabel extends BaseMenuItem {
  label: string;
  divider?: false;
}

interface MenuItemDivider extends BaseMenuItem {
  divider: true;
  label?: never;
  shortcut?: never;
  onClick?: never;
}

type MenuItem = MenuItemWithLabel | MenuItemDivider;

interface MenuProps {
  label: string;
  items: MenuItem[];
}

export default function Menu({ label, items }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="text-[var(--text-primary)] hover:text-[var(--text-primary)] px-2 py-1 rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
      </button>
      
      {isOpen && (
        <div className="absolute left-0 mt-1 w-56 rounded-md shadow-lg bg-[var(--navbar-bg)] border border-[var(--border-color)] z-50">
          <div className="py-1">
            {items.map((item, index) => (
              <div key={index}>
                {item.divider ? (
                  <hr className="my-1 border-[var(--border-color)]" />
                ) : (
                  <button
                    className="w-full px-4 py-2 text-sm text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] flex justify-between items-center"
                    onClick={() => {
                      item.onClick?.();
                      setIsOpen(false);
                    }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-[var(--text-secondary)] text-xs">{item.shortcut}</span>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 