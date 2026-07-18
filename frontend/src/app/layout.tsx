import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import '../styles/tailwind.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'ResearchOS — AI-Native Research Operating System',
  description:
    'ResearchOS generates structured reading curricula, critiques coverage gaps, and maps your knowledge graph — turning any research topic into a navigable learning system.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "'DM Sans', -apple-system, 'SF Pro Text', system-ui, sans-serif" }}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.08)',
              color: '#1d1d1f',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            },
          }}
        />
</body>
    </html>
  );
}