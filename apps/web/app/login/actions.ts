'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '../../lib/supabase/server';

export interface AuthState {
  error?: string;
}

function safeNext(next: FormDataEntryValue | null): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return '/home';
  return next;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'));

  if (!email || !password) return { error: 'Email y contraseña son obligatorios.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect(next);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const name = String(formData.get('name') ?? '').trim() || null;
  const next = safeNext(formData.get('next'));

  if (!email || !password) return { error: 'Email y contraseña son obligatorios.' };
  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: name ? { data: { name } } : undefined,
  });
  if (error) return { error: error.message };

  // If email confirmation is enabled, there's no session yet — surface a hint.
  if (!data.session) {
    return { error: 'Te enviamos un mail para confirmar la cuenta. Confirmalo y volvé a entrar.' };
  }

  revalidatePath('/', 'layout');
  redirect(next);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
