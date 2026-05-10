import { redirect } from 'next/navigation';

import { apiClient, ApiError } from '../../lib/api-client';
import { createClient } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Token for the backend — middleware already verified the user above.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  let profile;
  try {
    profile = await apiClient.users.me(session.access_token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return (
        <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
          <h1>Profile</h1>
          <p>
            Authenticated as <strong>{user.email}</strong> but no profile row exists yet.
          </p>
          <p>POST <code>/users</code> with your auth id to create one.</p>
        </main>
      );
    }
    throw err;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>Profile</h1>
      <dl>
        <dt>id</dt>
        <dd><code>{profile.id}</code></dd>
        <dt>email</dt>
        <dd>{profile.email}</dd>
        <dt>name</dt>
        <dd>{profile.name ?? <em>(not set)</em>}</dd>
        <dt>created at</dt>
        <dd>{new Date(profile.createdAt).toISOString()}</dd>
      </dl>
    </main>
  );
}
