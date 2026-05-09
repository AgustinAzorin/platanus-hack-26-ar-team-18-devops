import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './chats.css';

export const metadata: Metadata = {
  title: 'casita·fast — conversaciones',
  description: 'Chats con propietarios e inmobiliarias',
};

export default function ChatsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
