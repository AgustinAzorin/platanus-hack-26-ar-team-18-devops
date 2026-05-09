import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './pending/casita.css';

export const metadata: Metadata = {
  title: 'team-18',
  description: 'Platanus Hack 26 — team-18',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        {children}
      </body>
    </html>
  );
}
