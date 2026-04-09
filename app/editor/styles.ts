/**
 * Shared design tokens for the /editor admin app. Mirrors the
 * client-component-local color/font constants used elsewhere in
 * the codebase (HomeClient, ArticleClient) so the editor visually
 * matches the public site without dragging in a theme system.
 */

export const C = {
  indigo: '#1B3A5C',
  charcoal: '#2D2D2D',
  warmGray: '#A39E93',
  offWhite: '#F8F6F1',
  cream: '#F0EDE6',
  lightWarm: '#E8E4DB',
  green: '#2e7d32',
  red: '#c62828',
};

export const F = {
  display: "'Playfair Display', Georgia, serif",
  body: "'Source Serif 4', Georgia, serif",
  ui: "'DM Sans', 'Helvetica Neue', sans-serif",
  jp: "'Noto Sans JP', sans-serif",
};

export const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: `1px solid ${C.lightWarm}`,
  borderRadius: 4,
  fontFamily: F.ui,
  fontSize: 14,
  background: '#fff',
  outline: 'none',
  color: C.charcoal,
  boxSizing: 'border-box' as const,
};

export const labelStyle = {
  fontFamily: F.ui,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: C.charcoal,
  marginBottom: 6,
  display: 'block' as const,
};

export const primaryButtonStyle = (disabled = false) => ({
  width: '100%',
  padding: '14px',
  background: disabled ? C.warmGray : C.indigo,
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  fontFamily: F.ui,
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: '0.06em',
  cursor: disabled ? 'wait' : 'pointer',
  opacity: disabled ? 0.6 : 1,
});

export const secondaryButtonStyle = {
  padding: '10px 16px',
  background: '#fff',
  color: C.indigo,
  border: `1px solid ${C.indigo}`,
  borderRadius: 4,
  fontFamily: F.ui,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
};
