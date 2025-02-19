import { Inter } from "next/font/google";
import "./globals.css";
import { metadata } from './metadata';
import ClientProviders from '@/components/providers/ClientProviders';

const inter = Inter({ subsets: ["latin"] });

export { metadata };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
