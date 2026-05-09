import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'casita·fast — setup inicial',
  description: 'Configuración inicial del bot',
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
