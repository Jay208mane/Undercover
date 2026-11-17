import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import type {
  InternalGameState,
  LocalGameConfig,
  SafePlayer,
  PlayerView,
  EliminationResult,
  WinResult,
  PlayerResult,
  SafeConfig,
} from '../engine/types';
import {
  initGame,
  pickRoleCard,
  showRoundWordReveal,
  hideReveal,
  startVoting,
  eliminateGroupSelection,
  returnToDiscussion,
  continueToDiscussion,
  submitMrWhiteGuess,
  getCurrentRevealPlayer,
  getCurrentPlayerView,
  getAliveSafePlayers,
  getGameResults,
  getAvailableRoleCardIds,
  getSafeConfig,
} from '../engine/gameEngine';
import { calculateGameScores } from '../engine/scoring';
import type { AllTimeLeaderboard, CurrentGameLeaderboard } from './leaderboardStorage';
import {
  applyAllTimeScores,
  applyCurrentGameScores,
  clearAllTimeLeaderboard as clearStoredAllTimeLeaderboard,
  createCurrentGameLeaderboard,
  loadAllTimeLeaderboard,
  loadCurrentGameLeaderboard,
  persistAllTimeLeaderboard,
  persistCurrentGameLeaderboard,
  registerPlayerIdentities,
} from './leaderboardStorage';

// ── What we expose to UI components — NO InternalGameState, NO LocalGameConfig ──

interface LocalGameContextValue {
  // Phase
  phase: InternalGameState['phase'];
  round: number;

  // Setup
  startGame: (config: LocalGameConfig) => void;
  restartGame: () => void;
  resetGame: () => void;

  // Reveal
  currentRevealPlayer: SafePlayer | null;
  currentPlayerView: PlayerView | null;         // present only during ROLE_REVEAL_SHOW
  revealIndex: number;
  revealPlayerCount: number;
  totalPlayers: number;
  availableRoleCardIds: string[];
  remainingCards: number;
  onPickRoleCard: (cardId: string) => void;
  onShowNextRoundWord: () => void;
  onHideClick: () => void;

  // Discussion
  alivePlayers: SafePlayer[];
  onStartVoting: () => void;

  // Voting
  onConfirmElimination: (playerId: string) => void;
  onReturnToDiscussion: () => void;
  groupVoteError: string | null;

  // Elimination — EliminationResult is revealed info, only present during ELIMINATION_RESULT / MR_WHITE_GUESS
  lastElimination: EliminationResult | null;
  onContinueAfterElimination: () => void;

  // Mr. White guess
  onSubmitMrWhiteGuess: (guess: string) => void;

  // Results
  winResult: WinResult | null;
  gameResults: PlayerResult[];
  allTimeLeaderboard: AllTimeLeaderboard;
  currentGameLeaderboard: CurrentGameLeaderboard | null;
  leaderboardStorageError: 'saveInitial' | 'saveScores' | 'reset' | null;
  resetAllTimeLeaderboard: () => boolean;

  // Safe config — no word data, only shape/timer/language info
  safeConfig: SafeConfig | null;
  // Civilian word exposed ONLY after GAME_OVER
  civilianWord: string | null;
}

const LocalGameContext = createContext<LocalGameContextValue | null>(null);

export function LocalGameProvider({ children }: { children: ReactNode }) {
  // InternalGameState is PRIVATE — never put on context, never return raw
  const [state, setState] = useState<InternalGameState | null>(null);
  const [groupVoteError, setGroupVoteError] = useState<string | null>(null);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState(loadAllTimeLeaderboard);
  const [currentGameLeaderboard, setCurrentGameLeaderboard] = useState(loadCurrentGameLeaderboard);
  const [leaderboardStorageError, setLeaderboardStorageError] =
    useState<'saveInitial' | 'saveScores' | 'reset' | null>(null);
  const scoredGamesRef = useRef(new Set<string>());

  const startGame = useCallback((config: LocalGameConfig) => {
    const registered = registerPlayerIdentities(
      loadAllTimeLeaderboard(),
      config.playerNames,
      createPlayerId
    );
    const gameState = initGame({ ...config, playerIds: registered.playerIds });
    const currentBoard = createCurrentGameLeaderboard(
      gameState.gameId,
      gameState.players.map(({ id, name }) => ({ playerId: id, name }))
    );
    setState(gameState);
    setGroupVoteError(null);
    setLeaderboardStorageError(null);
    setAllTimeLeaderboard(registered.leaderboard);
    const allTimeSaved = persistAllTimeLeaderboard(registered.leaderboard);
    const currentSaved = persistCurrentGameLeaderboard(currentBoard);
    setCurrentGameLeaderboard(currentBoard);
    if (!allTimeSaved || !currentSaved) {
      setLeaderboardStorageError('saveInitial');
    }
  }, []);

  const restartGame = useCallback(() => {
    if (state) {
      startGame(state.config);
      setGroupVoteError(null);
    }
  }, [state, startGame]);

  const resetGame = useCallback(() => {
    setState(null);
    setGroupVoteError(null);
  }, []);

  const resetAllTimeLeaderboard = useCallback(() => {
    const cleared = clearStoredAllTimeLeaderboard();
    if (!cleared) {
      setLeaderboardStorageError('reset');
      return false;
    }
    setAllTimeLeaderboard(loadAllTimeLeaderboard());
    setLeaderboardStorageError(null);
    return true;
  }, []);

  useEffect(() => {
    if (!state || state.phase !== 'GAME_OVER' || !state.winResult) return;
    if (scoredGamesRef.current.has(state.gameId)) return;
    scoredGamesRef.current.add(state.gameId);

    const scores = calculateGameScores(
      getGameResults(state),
      state.winResult.winner,
      state.startingCivilianCount,
      state.startingPlayerCount
    );
    const persistedCurrentBoard = loadCurrentGameLeaderboard();
    const currentBoard = applyCurrentGameScores(
      persistedCurrentBoard?.gameId === state.gameId
        ? persistedCurrentBoard
        : createCurrentGameLeaderboard(
            state.gameId,
            state.players.map(({ id, name }) => ({ playerId: id, name }))
          ),
      state.gameId,
      scores
    );
    const currentSaved = persistCurrentGameLeaderboard(currentBoard);
    setCurrentGameLeaderboard(currentBoard);

    const updatedAllTime = applyAllTimeScores(loadAllTimeLeaderboard(), state.gameId, scores);
    const allTimeSaved = persistAllTimeLeaderboard(updatedAllTime);
    setAllTimeLeaderboard(updatedAllTime);
    if (!currentSaved || !allTimeSaved) {
      setLeaderboardStorageError('saveScores');
    } else {
      setLeaderboardStorageError(null);
    }
  }, [state]);

  const transition = useCallback(
    (fn: (s: InternalGameState) => InternalGameState) => {
      setState((prev) => {
        if (!prev) return prev;
        try {
          return fn(prev);
        } catch (e) {
          // Never log role/word data — only the structural error message
          const msg = (e as Error).message;
          if (!msg.toLowerCase().includes('role') && !msg.toLowerCase().includes('word')) {
            console.error('Game engine error:', msg);
          }
          return prev;
        }
      });
    },
    []
  );

  const onPickRoleCard = useCallback(
    (cardId: string) => transition((current) => pickRoleCard(current, cardId)),
    [transition]
  );
  const onShowNextRoundWord = useCallback(
    () => transition(showRoundWordReveal),
    [transition]
  );
  const onHideClick = useCallback(() => transition(hideReveal), [transition]);
  const onStartVoting = useCallback(() => transition(startVoting), [transition]);
  const onConfirmElimination = useCallback((playerId: string) => {
    setGroupVoteError(null);
    setState((prev) => {
      if (!prev) return prev;
      try {
        return eliminateGroupSelection(prev, playerId);
      } catch (e) {
        setGroupVoteError((e as Error).message);
        return prev;
      }
    });
  }, []);
  const onReturnToDiscussion = useCallback(() => {
    setGroupVoteError(null);
    transition(returnToDiscussion);
  }, [transition]);

  const onContinueAfterElimination = useCallback(
    () => transition(continueToDiscussion),
    [transition]
  );

  const onSubmitMrWhiteGuess = useCallback(
    (guess: string) => {
      setState((prev) => {
        if (!prev) return prev;
        try {
          return submitMrWhiteGuess(prev, guess);
        } catch (e) {
          return prev;
        }
      });
    },
    []
  );

  // ── Build context value from safe accessors ONLY ─────────────────────────
  const value: LocalGameContextValue = {
    phase: state?.phase ?? 'SETUP',
    round: state?.round ?? 1,

    // Safe config — strips customWordPair
    safeConfig: state ? getSafeConfig(state) : null,

    // Civilian word only after GAME_OVER
    civilianWord: state?.phase === 'GAME_OVER' ? (state.civilianWord ?? null) : null,

    startGame,
    restartGame,
    resetGame,

    currentRevealPlayer: state ? getCurrentRevealPlayer(state) : null,
    // PlayerView only during ROLE_REVEAL_SHOW phase — null at all other times
    currentPlayerView: state?.phase === 'ROLE_REVEAL_SHOW'
      ? getCurrentPlayerView(state)
      : null,
    revealIndex: state?.phase === 'ROUND_WORD_REVEAL_QUEUE' || state?.phase === 'ROUND_WORD_REVEAL_SHOW'
      ? state.roundWordRevealIndex
      : state?.revealQueueIndex ?? 0,
    revealPlayerCount: state?.phase === 'ROUND_WORD_REVEAL_QUEUE' || state?.phase === 'ROUND_WORD_REVEAL_SHOW'
      ? state.roundWordRevealPlayerIds.length
      : state?.players.length ?? 0,
    totalPlayers: state?.players.length ?? 0,
    availableRoleCardIds: state ? getAvailableRoleCardIds(state) : [],
    remainingCards: state?.roleCards.filter((card) => !card.picked).length ?? 0,
    onPickRoleCard,
    onShowNextRoundWord,
    onHideClick,

    alivePlayers: state ? getAliveSafePlayers(state) : [],
    onStartVoting,

    onConfirmElimination,
    onReturnToDiscussion,
    groupVoteError,

    // EliminationResult present only during ELIMINATION_RESULT / MR_WHITE_GUESS
    // cleared to null once continueToDiscussion is called
    lastElimination: state?.lastElimination ?? null,
    onContinueAfterElimination,

    onSubmitMrWhiteGuess,

    winResult: state?.winResult ?? null,
    gameResults:
      state?.phase === 'GAME_OVER' && state?.winResult
        ? calculateGameScores(
            getGameResults(state),
            state.winResult.winner,
            state.startingCivilianCount,
            state.startingPlayerCount
          )
        : [],
    allTimeLeaderboard,
    currentGameLeaderboard,
    leaderboardStorageError,
    resetAllTimeLeaderboard,

  };

  return (
    <LocalGameContext.Provider value={value}>{children}</LocalGameContext.Provider>
  );
}

function createPlayerId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `player_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export function useLocalGame(): LocalGameContextValue {
  const ctx = useContext(LocalGameContext);
  if (!ctx) throw new Error('useLocalGame must be used inside LocalGameProvider');
  return ctx;
}
