import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>team-18</h1>
      <p>Monorepo skeleton — Next.js + NestJS + Prisma + Supabase.</p>
      <ul>
        <li>
          <Link href="/profile">/profile</Link> — authenticated user profile (calls the Nest API)
        </li>
      </ul>
    </main>
  );
}
