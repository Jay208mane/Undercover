import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '1.5rem' }}>
      <span style={{ fontSize: '4rem' }}>🕵️</span>
      <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Page not found</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>This room doesn't exist — or the game already ended.</p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </main>
  );
}
