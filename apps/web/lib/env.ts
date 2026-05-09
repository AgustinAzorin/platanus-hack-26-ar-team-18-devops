import { z } from 'zod';

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_API_URL: z.string().url(),
});

type Env = z.infer<typeof PublicEnvSchema>;

let cached: Env | null = null;

function load(): Env {
  if (cached) return cached;
  const parsed = PublicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Missing or invalid public env vars (set them in Vercel → Project Settings → Environment Variables, or in apps/web/.env.local for local dev):\n${issues}`,
    );
  }
  cached = parsed.data;
  return cached;
}

// Lazy proxy: validation only triggers on actual access, so importing this
// module during Next's "Collecting page data" build step doesn't blow up
// when env vars aren't present yet (local CI, dry-run builds, etc.).
export const env = new Proxy({} as Env, {
  get(_target, key: string) {
    return load()[key as keyof Env];
  },
});
