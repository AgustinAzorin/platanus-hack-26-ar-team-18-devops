import { fetchFeed } from './data';
import FeedClient from './feed-client';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const { cards, summary } = await fetchFeed(12);
  return <FeedClient cards={cards} summary={summary} />;
}
