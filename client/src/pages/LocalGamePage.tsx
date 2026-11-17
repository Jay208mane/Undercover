import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocalGame } from '../game/local/LocalGameProvider';
import { RoleRevealQueueScreen } from '../components/game/RoleRevealQueueScreen';
import { RoundWordRevealQueueScreen } from '../components/game/RoundWordRevealQueueScreen';
import { RoleRevealShowScreen } from '../components/game/RoleRevealShowScreen';
import { DiscussionScreen } from '../components/game/DiscussionScreen';
import { GroupVotingScreen } from '../components/game/GroupVotingScreen';
import { EliminationResultScreen } from '../components/game/EliminationResultScreen';
import { MrWhiteGuessScreen } from '../components/game/MrWhiteGuessScreen';
import { GameOverScreen } from '../components/game/GameOverScreen';
import type { LocalGameConfig } from '../game/engine/types';

function GameBootstrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { config?: LocalGameConfig } | null;
  const config = routeState?.config ?? null;
  const { startGame, phase, revealIndex } = useLocalGame();
  const startedConfigRef = useRef<LocalGameConfig | null>(null);

  useEffect(() => {
    if (!config) {
      if (phase === 'SETUP') navigate('/play/local', { replace: true });
      return;
    }
    if (startedConfigRef.current === config) return;
    startedConfigRef.current = config;
    startGame(config);
  }, [config, navigate, startGame]);

  switch (phase) {
    case 'ROLE_REVEAL_QUEUE':    return <RoleRevealQueueScreen />;
    case 'ROUND_WORD_REVEAL_QUEUE': return <RoundWordRevealQueueScreen />;
    // key={revealIndex} forces a fresh component (and fresh local state) for every player
    case 'ROLE_REVEAL_SHOW':
    case 'ROUND_WORD_REVEAL_SHOW': return <RoleRevealShowScreen key={`${phase}-${revealIndex}`} />;
    case 'DISCUSSION':           return <DiscussionScreen />;
    case 'VOTING_QUEUE':         return <GroupVotingScreen />;
    case 'ELIMINATION_RESULT':   return <EliminationResultScreen />;
    case 'MR_WHITE_GUESS':       return <MrWhiteGuessScreen />;
    case 'GAME_OVER':            return <GameOverScreen />;
    default:
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading game…
        </div>
      );
  }
}

export default function LocalGamePage() {
  return <GameBootstrapper />;
}
