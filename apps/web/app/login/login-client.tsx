'use client';

import { useActionState, useState } from 'react';

import CasitaLogo from '../../components/casita-logo';
import { signIn, signUp, type AuthState } from './actions';

const INITIAL: AuthState = {};

interface LoginClientProps {
  next: string;
}

export default function LoginClient({ next }: LoginClientProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const action = mode === 'signin' ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div className="login-brand-mark">
            <CasitaLogo size={42} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>casita<span style={{ color: 'var(--fg-3)' }}>·</span>fast</div>
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: 36, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          {mode === 'signin' ? (
            <>Volvé a tu <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: 'var(--fg-2)' }}>búsqueda</span>.</>
          ) : (
            <>Empezá a buscar <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: 'var(--fg-2)' }}>con Casita</span>.</>
          )}
        </h1>
        <p style={{ color: 'var(--fg-2)', margin: '0 0 28px', fontSize: 14 }}>
          {mode === 'signin' ? 'Ingresá con tu mail y contraseña.' : 'Creá tu cuenta. Te alcanzan un mail y una contraseña.'}
        </p>

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input type="hidden" name="next" value={next} />

          {mode === 'signup' && (
            <Field label="Nombre">
              <input
                name="name"
                type="text"
                placeholder="Cómo te llamás"
                autoComplete="name"
                style={inputStyle}
              />
            </Field>
          )}

          <Field label="Email">
            <input
              name="email"
              type="email"
              required
              placeholder="vos@ejemplo.com"
              autoComplete="email"
              style={inputStyle}
            />
          </Field>

          <Field label="Contraseña">
            <input
              name="password"
              type="password"
              required
              minLength={mode === 'signup' ? 8 : undefined}
              placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : '••••••••'}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              style={inputStyle}
            />
          </Field>

          {state?.error && (
            <div style={{
              fontSize: 13, color: 'var(--neg)',
              background: 'oklch(0.68 0.20 25 / 0.08)', border: '1px solid oklch(0.68 0.20 25 / 0.3)',
              borderRadius: 10, padding: '10px 12px',
            }}>
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-acc"
            style={{ marginTop: 6, justifyContent: 'center', opacity: pending ? 0.6 : 1 }}
          >
            {pending ? 'Procesando…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 13, color: 'var(--fg-2)', textAlign: 'center' }}>
          {mode === 'signin' ? (
            <>¿No tenés cuenta?{' '}
              <button onClick={() => setMode('signup')} style={linkButton}>Creá una</button>
            </>
          ) : (
            <>¿Ya tenés cuenta?{' '}
              <button onClick={() => setMode('signin')} style={linkButton}>Entrá</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  background: 'var(--bg-1)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  color: 'var(--fg)',
};

const linkButton: React.CSSProperties = {
  color: 'var(--acc)',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  fontSize: 13,
  background: 'none',
  border: 0,
  padding: 0,
  cursor: 'pointer',
};
