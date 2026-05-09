import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'casita·fast — pendientes',
  description: 'Aprobaciones pendientes del bot buscador',
};

export default function PendingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
