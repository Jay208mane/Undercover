import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '../components/common/Buttons';
import { useTimer } from '../hooks/useTimer';
import { Play, Pause, RotateCcw, Users } from 'lucide-react';
import type { useOnlineGame } from '../game/online/useOnlineGame';

type GameProp = ReturnType<typeof useOnlineGame>;

export default function OnlineGameScreen({ game }: { game: GameProp }) {
  switch (game.phase) {
    case 'ROLE_REVEAL':        return <OnlineRoleReveal game={game} />;
    case 'DISCUSSION':         return <OnlineDiscussion game={game} />;
    case 'VOTING':             return <OnlineVoting game={game} />;
    case 'ELIMINATION_RESULT': return <OnlineEliminationResult game={game} />;
    case 'MR_WHITE_GUESS':     return <OnlineMrWhiteGuess game={game} />;
    case 'GAME_OVER':          return <OnlineGameOver game={game} />;
    case 'DISCONNECTED':       return <OnlineDisconnected game={game} />;
    default:
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Syncing game state…
        </div>
      );
  }
}

// ── Role Reveal ───────────────────────────────────────────────────────────────

function OnlineRoleReveal({ game }: { game: GameProp }) {
  const [wordVisible, setWordVisible] = useState(false);
  const { myRole } = game;

  if (!myRole) {
    return (
      <div style={fullCenter}>
        <span style={{ fontSize: '2rem' }}>⏳</span>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>Receiving your role…</p>
      </div>
    );
  }

  const { word, roleLabel, instructions } = myRole;
  const roleColor =
    roleLabel === 'Civilian' ? 'var(--color-success)'
    : roleLabel === 'Mr. White' ? 'var(--color-accent-soft)'
    : 'var(--color-text)';

  const roleIcon = roleLabel === 'Civilian' ? '🧑' : roleLabel === 'Mr. White' ? '👻' : '🎭';

  return (
    <div style={{ ...fullCenter, padding: '1.5rem', gap: '1.5rem', maxWidth: '420px', margin: '0 auto', width: '100%' }}>
      {/* Fixed glow */}
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(circle at 50% 30%, ${roleColor}18, transparent 60%)`, pointerEvents: 'none' }} />

      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <span style={{ fontSize: '2.5rem' }}>{roleIcon}</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>Your Role</h2>
        {roleLabel && (
          <span style={{ display: 'inline-block', marginTop: '0.375rem', padding: '0.25rem 0.875rem', borderRadius: 'var(--radius-full)', background: `${roleColor}22`, color: roleColor, fontWeight: 700, fontSize: '0.875rem', border: `1px solid ${roleColor}44` }}>
            {roleLabel}
          </span>
        )}
      </div>

      <div style={{ width: '100%', background: 'var(--color-bg-card)', border: `1px solid ${wordVisible ? roleColor + '44' : 'var(--color-border)'}`, borderRadius: 'var(--radius-xl)', padding: '1.5rem', textAlign: 'center', zIndex: 1 }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Your Secret Word</p>
        {word !== null ? (
          <>
            <div style={{ fontSize: wordVisible ? 'clamp(1.75rem,8vw,2.5rem)' : '2rem', fontWeight: 900, filter: wordVisible ? 'none' : 'blur(10px)', userSelect: wordVisible ? 'text' : 'none', transition: 'filter 0.4s', color: 'var(--color-text)', minHeight: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {word}
            </div>
            <button onClick={() => setWordVisible((v) => !v)} style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 1rem', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.8125rem', cursor: 'pointer', margin: '1rem auto 0' }}>
              {wordVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              {wordVisible ? 'Hide word' : 'Tap to reveal'}
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>You have no secret word.</p>
        )}
      </div>

      <div style={{ width: '100%', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.65, zIndex: 1 }}>
        💬 {instructions}
      </div>

      {game.isHost && (
        <PrimaryButton fullWidth onClick={game.advancePhase} style={{ zIndex: 1 }}>
          Everyone has seen their role → Start Discussion
        </PrimaryButton>
      )}
      {!game.isHost && (
        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.875rem', zIndex: 1 }}>Waiting for host to start discussion…</p>
      )}
    </div>
  );
}

// ── Discussion ────────────────────────────────────────────────────────────────

function OnlineDiscussion({ game }: { game: GameProp }) {
  const { roomState, isHost } = game;
  const timerSecs = roomState?.discussionTimerSeconds ?? 180;
  const { formatted, isRunning, isExpired, seconds, start, pause, reset } = useTimer({ initialSeconds: timerSecs });
  const pct = timerSecs > 0 ? (seconds / timerSecs) * 100 : 100;
  const timerColor = pct > 50 ? 'var(--color-success)' : pct > 20 ? 'var(--color-warning)' : 'var(--color-danger)';
  const alivePlayers = roomState?.players.filter((p) => p.isAlive) ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div style={{ padding: '1rem 1.25rem 0', maxWidth: '480px', width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Discussion</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Round {roomState?.round ?? 1}</p>
          </div>
          <div style={{ padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            <Users size={12} style={{ display: 'inline', marginRight: '0.375rem' }} />
            {alivePlayers.length} alive
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '1.25rem', maxWidth: '480px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {timerSecs > 0 && (
          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>Discussion Timer</p>
            <div style={{ position: 'relative', width: '7rem', height: '7rem', margin: '0 auto 1rem' }}>
              <svg width="112" height="112" viewBox="0 0 112 112" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="56" cy="56" r="48" fill="none" stroke="var(--color-border)" strokeWidth="6" />
                <circle cx="56" cy="56" r="48" fill="none" stroke={timerColor} strokeWidth="6" strokeDasharray={`${2 * Math.PI * 48}`} strokeDashoffset={`${2 * Math.PI * 48 * (1 - pct / 100)}`} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear, stroke 1s' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>{formatted}</span>
              </div>
            </div>
            {isExpired ? (
              <p style={{ color: 'var(--color-warning)', fontSize: '0.875rem', fontWeight: 600 }}>⏰ Time's up!</p>
            ) : (
              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center' }}>
                {isRunning
                  ? <button onClick={pause} style={timerBtnStyle}><Pause size={15} /> Pause</button>
                  : <button onClick={start} style={{ ...timerBtnStyle, background: 'rgba(124,95,230,0.15)', color: 'var(--color-accent-soft)', borderColor: 'rgba(124,95,230,0.3)' }}><Play size={15} /> {seconds === timerSecs ? 'Start' : 'Resume'}</button>}
                <button onClick={reset} style={timerBtnStyle}><RotateCcw size={14} /> Reset</button>
              </div>
            )}
          </div>
        )}

        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.65 }}>
            💬 Each player gives one clue about their word. Discuss who might be the Imposter.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {alivePlayers.map((p) => (
            <div key={p.id} style={{ padding: '0.375rem 0.875rem', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', fontWeight: 500 }}>
              {p.name}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        {isHost && (
          <PrimaryButton fullWidth onClick={game.advancePhase}>
            Start Voting
          </PrimaryButton>
        )}
        {!isHost && (
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.875rem', textAlign: 'center' }}>Waiting for host to start voting…</p>
        )}
      </div>
    </div>
  );
}

// ── Voting ────────────────────────────────────────────────────────────────────

function OnlineVoting({ game }: { game: GameProp }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const { roomState, playerId } = game;
  const alivePlayers = (roomState?.players ?? []).filter((p) => p.isAlive && p.id !== playerId);
  const { votedCount, totalVoters } = game;

  const handleVote = () => {
    if (!selected || voted) return;
    game.submitVote(selected);
    setVoted(true);
  };

  if (voted) {
    return (
      <div style={{ ...fullCenter, padding: '1.5rem', gap: '1.5rem', maxWidth: '420px', margin: '0 auto', width: '100%' }}>
        <span style={{ fontSize: '3rem' }}>🗳️</span>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontWeight: 800 }}>Vote submitted!</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Waiting for others… ({votedCount}/{totalVoters})</p>
        </div>
        <div style={{ width: '100%', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '0.875rem 1rem' }}>
          <div style={{ height: '6px', borderRadius: 'var(--radius-full)', background: 'var(--color-border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${totalVoters > 0 ? (votedCount / totalVoters) * 100 : 0}%`, background: 'var(--color-accent)', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div style={{ padding: '1rem 1.25rem', maxWidth: '480px', width: '100%', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Vote</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Who do you think is the Imposter?</p>
      </div>
      <div style={{ flex: 1, padding: '0 1.25rem 2rem', maxWidth: '480px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {alivePlayers.map((p) => (
          <button key={p.id} onClick={() => setSelected(p.id)} style={{ width: '100%', padding: '1rem 1.25rem', background: selected === p.id ? 'rgba(124,95,230,0.12)' : 'var(--color-bg-card)', border: `1px solid ${selected === p.id ? 'var(--color-accent)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all var(--transition-fast)', color: 'var(--color-text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span style={{ fontWeight: 600 }}>{p.name}</span>
            </div>
            {selected === p.id && <Check size={18} color="var(--color-accent)" />}
          </button>
        ))}
        {game.error && <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{game.error}</p>}
        <div style={{ flex: 1 }} />
        <PrimaryButton fullWidth disabled={!selected} onClick={handleVote}>Submit Vote</PrimaryButton>
      </div>
    </div>
  );
}

// ── Elimination result ────────────────────────────────────────────────────────

function OnlineEliminationResult({ game }: { game: GameProp }) {
  const { lastElimination, isHost, roomState } = game;
  if (!lastElimination) return null;

  const roleColor = lastElimination.revealedRole === 'CIVILIAN' ? 'var(--color-success)' : lastElimination.revealedRole === 'IMPOSTER' ? 'var(--color-danger)' : 'var(--color-accent-soft)';
  const roleLabel = lastElimination.revealedRole === 'CIVILIAN' ? '🧑 Civilian' : lastElimination.revealedRole === 'IMPOSTER' ? '🕵️ Imposter' : '👻 Mr. White';

  return (
    <div style={{ ...fullCenter, padding: '1.5rem', gap: '1.75rem', maxWidth: '420px', margin: '0 auto', width: '100%' }}>
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(circle at 50% 40%, ${roleColor}18, transparent 60%)`, pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', animation: 'dropIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ fontSize: '4.5rem', marginBottom: '0.5rem' }}>{lastElimination.revealedRole === 'IMPOSTER' ? '💀' : lastElimination.revealedRole === 'MR_WHITE' ? '👻' : '😇'}</div>
        <div style={{ padding: '0.375rem 1.25rem', borderRadius: 'var(--radius-full)', background: `${roleColor}22`, color: roleColor, fontWeight: 700, fontSize: '1rem', border: `1px solid ${roleColor}44`, display: 'inline-block' }}>{roleLabel}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Eliminated</p>
        <h2 style={{ fontSize: 'clamp(1.75rem,8vw,2.5rem)', fontWeight: 900 }}>{lastElimination.playerName}</h2>
      </div>
      {lastElimination.revealedWord && (
        <div style={{ width: '100%', background: 'var(--color-bg-card)', border: `1px solid ${roleColor}33`, borderRadius: 'var(--radius-xl)', padding: '1.25rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Their Word Was</p>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: roleColor }}>{lastElimination.revealedWord}</p>
        </div>
      )}
      {isHost && <PrimaryButton fullWidth onClick={game.advancePhase}>Continue to Next Round</PrimaryButton>}
      {!isHost && <p style={{ color: 'var(--color-text-dim)', fontSize: '0.875rem' }}>Waiting for host…</p>}
      <style>{`@keyframes dropIn { from { opacity:0; transform:scale(0.4) translateY(-20px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>
    </div>
  );
}

// ── Mr. White guess ───────────────────────────────────────────────────────────

function OnlineMrWhiteGuess({ game }: { game: GameProp }) {
  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { mrWhiteCanGuess, lastElimination } = game;

  if (!mrWhiteCanGuess) {
    return (
      <div style={{ ...fullCenter, padding: '1.5rem', gap: '1rem' }}>
        <span style={{ fontSize: '3rem' }}>👻</span>
        <p style={{ color: 'var(--color-text-muted)' }}>Mr. White is guessing…</p>
      </div>
    );
  }

  return (
    <div style={{ ...fullCenter, padding: '1.5rem', gap: '2rem', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at 50% 35%, rgba(192,132,252,0.12), transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>👻</div>
        <h2 style={{ fontSize: 'clamp(1.5rem,7vw,2rem)', fontWeight: 800 }}>{lastElimination?.playerName}'s Last Chance</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>Guess the Civilian word to win.</p>
      </div>
      <div style={{ width: '100%', zIndex: 1 }}>
        <input className="input" type="text" value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Type the Civilian word…" disabled={submitted} autoFocus onKeyDown={(e) => { if (e.key === 'Enter' && guess.trim() && !submitted) { setSubmitted(true); game.submitMrWhiteGuess(guess.trim()); } }} style={{ textAlign: 'center', fontSize: '1.125rem', fontWeight: 700 }} />
      </div>
      <PrimaryButton fullWidth disabled={!guess.trim() || submitted} onClick={() => { setSubmitted(true); game.submitMrWhiteGuess(guess.trim()); }} style={{ zIndex: 1 }}>
        {submitted ? 'Checking…' : 'Submit Guess'}
      </PrimaryButton>
    </div>
  );
}

// ── Game over ─────────────────────────────────────────────────────────────────

function OnlineGameOver({ game }: { game: GameProp }) {
  const navigate = useNavigate();
  const { roomState, gameResults, civilianWord } = game;
  if (!roomState?.winnerFaction) return null;

  const winnerColor = roomState.winnerFaction === 'CIVILIANS' ? 'var(--color-success)' : roomState.winnerFaction === 'MR_WHITE' ? 'var(--color-accent-soft)' : 'var(--color-danger)';
  const winnerEmoji = roomState.winnerFaction === 'CIVILIANS' ? '🏆' : roomState.winnerFaction === 'MR_WHITE' ? '👻' : '🕵️';
  const winnerLabel = roomState.winnerFaction === 'CIVILIANS' ? 'Civilians Win!' : roomState.winnerFaction === 'MR_WHITE' ? 'Mr. White Wins!' : 'Imposters Win!';
  const roleLabel = (r: string) => r === 'CIVILIAN' ? 'Civilian' : r === 'IMPOSTER' ? 'Imposter' : 'Mr. White';
  const roleColor = (r: string) => r === 'CIVILIAN' ? 'var(--color-success)' : r === 'IMPOSTER' ? 'var(--color-danger)' : 'var(--color-accent-soft)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(circle at 50% 25%, ${winnerColor}18, transparent 55%)`, pointerEvents: 'none' }} />
      <div style={{ flex: 1, padding: '2rem 1.25rem 1.25rem', maxWidth: '480px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', zIndex: 1, position: 'relative' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>{winnerEmoji}</div>
          <div style={{ padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)', background: `${winnerColor}22`, color: winnerColor, fontWeight: 800, fontSize: '1.25rem', border: `1px solid ${winnerColor}44`, display: 'inline-block', marginBottom: '0.5rem' }}>{winnerLabel}</div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{roomState.winReason}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          {[
            { label: 'Rounds', value: roomState.round },
            { label: 'Players', value: roomState.players.length },
            { label: 'Civilian Word', value: civilianWord ?? '—' },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>{s.value}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.625rem' }}>All Roles Revealed</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {gameResults.map((p) => (
              <div key={p.id} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderLeft: `3px solid ${roleColor(p.role)}`, borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: p.isAlive ? 'var(--color-text)' : 'var(--color-text-dim)' }}>{p.name}</span>
                    {!p.isAlive && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>eliminated</span>}
                  </div>
                  <div style={{ fontSize: '0.8125rem', marginTop: '0.2rem', color: roleColor(p.role), fontWeight: 600 }}>
                    {roleLabel(p.role)}{p.word ? <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}> · {p.word}</span> : p.role === 'MR_WHITE' ? <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}> · no word</span> : null}
                  </div>
                </div>
                {p.totalVotesReceived > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '0.125rem 0.5rem' }}>{p.totalVotesReceived}v</span>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <PrimaryButton fullWidth onClick={() => { game.leaveRoom(); navigate('/play/online'); }}>Play Again</PrimaryButton>
          <SecondaryButton fullWidth onClick={() => { game.leaveRoom(); navigate('/'); }}>Return Home</SecondaryButton>
        </div>
      </div>
    </div>
  );
}

// ── Disconnected ──────────────────────────────────────────────────────────────

function OnlineDisconnected({ game }: { game: GameProp }) {
  const navigate = useNavigate();
  return (
    <div style={{ ...fullCenter, padding: '1.5rem', gap: '1.5rem', maxWidth: '380px', margin: '0 auto', width: '100%' }}>
      <span style={{ fontSize: '3rem' }}>📡</span>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontWeight: 800 }}>Disconnected</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Lost connection to the server.</p>
      </div>
      <PrimaryButton fullWidth onClick={() => navigate('/play/online')}>Back to Lobby</PrimaryButton>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const fullCenter: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', minHeight: '100dvh',
};

const timerBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
  padding: '0.4rem 0.875rem', borderRadius: 'var(--radius-md)',
  background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
  color: 'var(--color-text-muted)', fontSize: '0.8125rem', cursor: 'pointer',
};
