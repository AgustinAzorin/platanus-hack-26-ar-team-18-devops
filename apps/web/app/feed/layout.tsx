import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './feed.css';

export const metadata: Metadata = {
  title: 'casita·fast — encontrados',
  description: 'Propiedades filtradas por la IA',
};

export default function FeedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
