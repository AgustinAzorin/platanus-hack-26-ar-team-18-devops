import { fetchPendingCards } from './data';
import PendingClient from './pending-client';

export const dynamic = 'force-dynamic';

export default async function PendingPage() {
  const cards = await fetchPendingCards();
  return <PendingClient initialCards={cards} />;
}
