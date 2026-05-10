import '../pending/casita.css';

import LoginClient from './login-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  return <LoginClient next={next ?? '/home'} />;
}
