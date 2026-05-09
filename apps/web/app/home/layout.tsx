import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'casita·fast — buscar',
  description: 'Buscador de propiedades con IA',
};

export default function HomeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
