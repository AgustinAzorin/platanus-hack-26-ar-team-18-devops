import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../chats/chats.css';
import './search.css';

export const metadata: Metadata = {
  title: 'casita·fast — buscar',
  description: 'Búsqueda asistida por IA',
};

export default function SearchLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
