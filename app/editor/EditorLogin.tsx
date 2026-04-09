'use client';
import { useState } from 'react';
import { C, F, inputStyle, primaryButtonStyle } from './styles';

export default function EditorLogin({ nextUrl }: { nextUrl?: string }) {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/editor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        // Hard-navigate so the proxy re-evaluates the cookie on the
        // next request.
        window.location.href = nextUrl || '/editor';
      } else {
        setStatus('error');
        setError(data.error || 'ログインに失敗しました');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div
      style={{
        background: C.offWhite,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#fff',
          padding: 36,
          borderRadius: 6,
          border: `1px solid ${C.lightWarm}`,
          boxShadow: '0 4px 24px rgba(27,58,92,0.06)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 24,
              fontWeight: 700,
              color: C.charcoal,
            }}
          >
            TONE{' '}
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 400 }}>
              TOKYO
            </span>
          </div>
          <div
            style={{
              fontFamily: F.ui,
              fontSize: 11,
              color: C.warmGray,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginTop: 8,
            }}
          >
            Editor
          </div>
        </div>

        <form onSubmit={submit}>
          <label
            style={{
              fontFamily: F.ui,
              fontSize: 12,
              fontWeight: 600,
              color: C.indigo,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 8,
              display: 'block',
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            style={{ ...inputStyle, marginBottom: 16 }}
          />
          <button
            type="submit"
            disabled={status === 'sending' || !password}
            style={primaryButtonStyle(status === 'sending' || !password)}
          >
            {status === 'sending' ? '⏳ ログイン中...' : 'ログイン'}
          </button>
          {status === 'error' && (
            <div
              style={{
                marginTop: 14,
                padding: '10px 14px',
                background: '#fce4ec',
                borderRadius: 4,
                fontFamily: F.ui,
                fontSize: 12,
                color: C.red,
              }}
            >
              ❌ {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
