'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/config/web3';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from './ThemeProvider';
import { useState } from 'react';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="bottom-right" />
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
} 