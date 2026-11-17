import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Crown, Users, Wifi, WifiOff, LogOut, Play } from 'lucide-react';
import { useI18n } from '../context/i18nContext';
import { AppHeader } from '../components/common/AppHeader';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { PrimaryButton, SecondaryButton } from '../components/common/Buttons';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { useOnlineGame } from '../game/online/useOnlineGame';
import type { OnlineCreateConfig } from '../game/online/types';
import OnlineGameScreen from './OnlineGameScreen';

export default function OnlineLobbyPage() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const game = useOnlineGame();

  const [view, setView] = useState<'home' | 'create' | 'join'>('home');
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [createName, setCreateName] = useState('');
  const [mrWhite, setMrWhite] = useState(false);
  const [timer, setTimer] = useState(180);

  // Once in a room, show room management UI
  if (game.roomState && game.phase !== 'LOBBY') {
    return <OnlineGameScreen game={game} />;
  }

  if (game.roomState && game.phase === 'LOBBY') {
    return <RoomLobbyScreen game={game} onLeave={() => { game.leaveRoom(); }} />;
  }

  const handleCreate = () => {
    if (!createName.trim()) return;
    const cfg: OnlineCreateConfig = {
      playerName: createName.trim(),
      language: lang,
      category: 'random',
      mrWhiteEnabled: mrWhite,
      discussionTimerSeconds: timer,
    };
    game.createRoom(cfg);
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length !== 6 || !playerName.trim()) return;
    game.joinRoom(code, playerName.trim());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppHeader title={t.online} />

      {/* Connection status */}
      <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto', padding: '0 1rem 0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: game.connected ? 'var(--color-success)' : 'var(--color-text-dim)' }}>
          {game.connected ? <Wifi size={13} /> : <WifiOff size={13} />}
          {game.connected ? 'Connected to server' : 'Connecting…'}
        </div>
      </div>

      {game.error && (
        <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto', padding: '0 1rem 0.75rem' }}>
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {game.error}
            <button onClick={game.dismissError} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
          </div>
        </div>
      )}

      <ScreenContainer style={{ padding: '0.5rem 1rem 2rem', gap: '1rem' }}>
        {view === 'home' && (
          <>
            <PrimaryButton fullWidth onClick={() => setView('create')}>
              {t.createRoom}
            </PrimaryButton>
            <SecondaryButton fullWidth onClick={() => setView('join')}>
              {t.joinRoom}
            </SecondaryButton>
            <SecondaryButton fullWidth onClick={() => navigate(-1)}>
              {t.back}
            </SecondaryButton>
          </>
        )}

        {view === 'create' && (
          <>
            <h2 style={{ fontWeight: 800, fontSize: '1.125rem', width: '100%' }}>{t.createRoom}</h2>

            <div style={{ width: '100%' }}>
              <label style={labelStyle}>{t.playerName}</label>
              <input className="input" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder={t.playerNamePlaceholder} maxLength={20} autoCapitalize="words" />
            </div>

            <div style={{ width: '100%' }}>
              <label style={labelStyle}>{t.language}</label>
              <LanguageSelector />
            </div>

            <div style={{ width: '100%', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                <span>Include Mr. White</span>
                <ToggleSwitch checked={mrWhite} onChange={() => setMrWhite((v) => !v)} />
              </label>
              <div>
                <label style={labelStyle}>Discussion Timer: {timer}s</label>
                <input type="range" min={0} max={300} step={30} value={timer} onChange={(e) => setTimer(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                  <span>No timer</span><span>5 min</span>
                </div>
              </div>
            </div>

            <PrimaryButton fullWidth onClick={handleCreate} disabled={!createName.trim() || !game.connected}>
              {t.createRoom}
            </PrimaryButton>
            <SecondaryButton fullWidth onClick={() => setView('home')}>{t.back}</SecondaryButton>
          </>
        )}

        {view === 'join' && (
          <>
            <h2 style={{ fontWeight: 800, fontSize: '1.125rem', width: '100%' }}>{t.joinRoom}</h2>

            <div style={{ width: '100%' }}>
              <label style={labelStyle}>{t.playerName}</label>
              <input className="input" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder={t.playerNamePlaceholder} maxLength={20} autoCapitalize="words" />
            </div>

            <div style={{ width: '100%' }}>
              <label style={labelStyle}>{t.roomCode}</label>
              <input className="input" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder={t.roomCodePlaceholder} maxLength={6} style={{ letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }} />
            </div>

            <PrimaryButton fullWidth onClick={handleJoin} disabled={joinCode.length !== 6 || !playerName.trim() || !game.connected}>
              {t.joinRoom}
            </PrimaryButton>
            <SecondaryButton fullWidth onClick={() => setView('home')}>{t.back}</SecondaryButton>
          </>
        )}
      </ScreenContainer>
    </div>
  );
}

// ── Room lobby (waiting room) ─────────────────────────────────────────────────

function RoomLobbyScreen({ game, onLeave }: { game: ReturnType<typeof useOnlineGame>; onLeave: () => void }) {
  const { t } = useI18n();
  const { roomState, playerId, isHost, roomCode } = game;
  if (!roomState) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppHeader title="Room" showBack={false} right={
        <button onClick={onLeave} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <LogOut size={13} /> Leave
        </button>
      } />

      <ScreenContainer style={{ padding: '0.5rem 1rem 6rem', gap: '1.25rem' }}>

        {/* Room code */}
        <div style={{ width: '100%', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Room Code</p>
          <div style={{ fontSize: 'clamp(2rem, 10vw, 3rem)', fontWeight: 900, letterSpacing: '0.3em', color: 'var(--color-text)' }}>{roomCode}</div>
          <button onClick={game.copyRoomCode} style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.8125rem', cursor: 'pointer' }}>
            <Copy size={13} /> Copy code
          </button>
        </div>

        {/* Player list */}
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              <Users size={12} style={{ display: 'inline', marginRight: '0.375rem' }} />
              Players ({roomState.players.length}/20)
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {roomState.players.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: p.id === playerId ? 'rgba(124,95,230,0.08)' : 'var(--color-bg-card)', border: `1px solid ${p.id === playerId ? 'rgba(124,95,230,0.25)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)' }}>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ flex: 1, fontWeight: p.id === playerId ? 700 : 500 }}>{p.name} {p.id === playerId ? '(you)' : ''}</span>
                {roomState.hostId === p.id && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-warning)', fontWeight: 600 }}><Crown size={12} />{t.host}</span>}
              </div>
            ))}
          </div>
        </div>

        {roomState.players.length < 3 && (
          <div style={{ width: '100%', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 'var(--radius-lg)', padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--color-warning)' }}>
            Waiting for at least 3 players to join…
          </div>
        )}

        {game.error && (
          <div style={{ width: '100%', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-danger)' }}>
            {game.error}
          </div>
        )}
      </ScreenContainer>

      {isHost && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem 1rem calc(1rem + env(safe-area-inset-bottom))', background: 'linear-gradient(to top, var(--color-bg) 60%, transparent)', maxWidth: '480px', margin: '0 auto' }}>
          <PrimaryButton fullWidth onClick={game.startGame} disabled={roomState.players.length < 3} icon={<Play size={16} />}>
            Start Game
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <span onClick={onChange} style={{ width: '3rem', height: '1.625rem', borderRadius: '999px', background: checked ? 'linear-gradient(135deg,#7c5fe6,#5b8df5)' : 'var(--color-bg-elevated)', border: `1px solid ${checked ? 'transparent' : 'var(--color-border)'}`, position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.25s', display: 'inline-block' }}>
      <span style={{ position: 'absolute', top: '0.1875rem', left: checked ? 'calc(100% - 1.25rem)' : '0.1875rem', width: '1.25rem', height: '1.25rem', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 0.25s' }} />
    </span>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8125rem', fontWeight: 600,
  color: 'var(--color-text-muted)', marginBottom: '0.5rem',
  textTransform: 'uppercase', letterSpacing: '0.05em',
};
