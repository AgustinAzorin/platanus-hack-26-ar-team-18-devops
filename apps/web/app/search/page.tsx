import SearchClient from './search-client';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const initialQuery = (q ?? '').trim();
  return <SearchClient initialQuery={initialQuery} />;
}
