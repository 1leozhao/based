'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import components that use browser APIs with SSR disabled
const Navbar = dynamic(() => import('@/components/navbar/Navbar'), { ssr: false });
const Sidebar = dynamic(() => import('@/components/sidebar/Sidebar'), { ssr: false });
const Editor = dynamic(() => import('@/components/editor/Editor'), { ssr: false });

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <Navbar />
        <Sidebar />
        <Editor />
      </Suspense>
    </main>
  );
}
