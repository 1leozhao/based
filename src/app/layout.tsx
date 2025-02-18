'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/config/web3';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });
const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster position="bottom-right" />
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
