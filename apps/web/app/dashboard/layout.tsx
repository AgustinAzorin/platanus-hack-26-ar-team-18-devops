import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'casita·fast — métricas',
  description: 'Dashboard de métricas del bot',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
