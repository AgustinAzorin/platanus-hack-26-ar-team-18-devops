import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './approve.css';

export const metadata: Metadata = {
  title: 'casita·fast — aprobar',
  description: 'Aprobaciones del agente',
};

export default function ApproveLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
