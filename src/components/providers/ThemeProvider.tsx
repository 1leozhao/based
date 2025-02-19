'use client';

import { useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useEditorStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
} 