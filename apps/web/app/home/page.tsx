import { fetchLiveActivity } from './data';
import HomeClient from './home-client';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const activity = await fetchLiveActivity();
  return <HomeClient initialActivity={activity} />;
}
