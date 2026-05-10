import { fetchChats, fetchFeaturedProperty, fetchMessages } from './data';
import ChatsClient from './chats-client';

export const dynamic = 'force-dynamic';

interface ChatsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ChatsPage({ searchParams }: ChatsPageProps) {
  const { q } = await searchParams;
  const initialQuery = (q ?? '').trim();

  const [featured, chats] = await Promise.all([fetchFeaturedProperty(), fetchChats()]);
  const initialChatId = chats[0]?.id ?? null;
  const initialMessages = initialChatId ? await fetchMessages(initialChatId) : [];
  return (
    <ChatsClient
      featured={featured}
      chats={chats}
      initialChatId={initialChatId}
      initialMessages={initialMessages}
      initialAiQuery={initialQuery}
    />
  );
}
