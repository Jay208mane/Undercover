import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '../../services/socket';
import type {
  PublicOnlineState,
  PrivateRoleInfo,
  EliminationEvent,
  PlayerResult,
  OnlineCreateConfig,
  OnlinePhase,
} from './types';

interface OnlineGameState {
  connected: boolean;
  phase: OnlinePhase;
  roomCode: string | null;
  playerId: string | null;
  roomState: PublicOnlineState | null;
  myRole: PrivateRoleInfo | null;
  lastElimination: EliminationEvent | null;
  gameResults: PlayerResult[];
  civilianWord: string | null;
  error: string | null;
  votedCount: number;
  totalVoters: number;
  mrWhiteCanGuess: boolean;
}

const INITIAL: OnlineGameState = {
  connected: false,
  phase: 'LOBBY',
  roomCode: null,
  playerId: null,
  roomState: null,
  myRole: null,
  lastElimination: null,
  gameResults: [],
  civilianWord: null,
  error: null,
  votedCount: 0,
  totalVoters: 0,
  mrWhiteCanGuess: false,
};

export function useOnlineGame() {
  const [state, setState] = useState<OnlineGameState>(INITIAL);
  const tokenRef = useRef<string | null>(null);

  // Persist token in sessionStorage (not localStorage — clears on tab close)
  const saveSession = (roomCode: string, playerId: string, token: string) => {
    tokenRef.current = token;
    try {
      sessionStorage.setItem('uc_session', JSON.stringify({ roomCode, playerId, token }));
    } catch (_) { /* storage unavailable */ }
  };

  const clearSession = () => {
    tokenRef.current = null;
    try { sessionStorage.removeItem('uc_session'); } catch (_) {}
  };

  useEffect(() => {
    const socket = getSocket();
    connectSocket();

    socket.on('connect', () => setState((s) => ({ ...s, connected: true, error: null })));
    socket.on('disconnect', () => setState((s) => ({ ...s, connected: false, phase: 'DISCONNECTED' })));
    socket.on('connect_error', () => setState((s) => ({ ...s, error: 'Cannot reach the server.' })));

    socket.on('room_created', ({ roomCode, playerId, sessionToken, state: roomState }: {
      roomCode: string; playerId: string; sessionToken: string; state: PublicOnlineState;
    }) => {
      saveSession(roomCode, playerId, sessionToken);
      setState((s) => ({ ...s, roomCode, playerId, roomState, phase: 'LOBBY', error: null }));
    });

    socket.on('room_joined', ({ roomCode, playerId, sessionToken, state: roomState }: {
      roomCode: string; playerId: string; sessionToken: string; state: PublicOnlineState;
    }) => {
      saveSession(roomCode, playerId, sessionToken);
      setState((s) => ({ ...s, roomCode, playerId, roomState, phase: 'LOBBY', error: null }));
    });

    socket.on('room_updated', ({ state: roomState }: { state: PublicOnlineState }) => {
      setState((s) => ({
        ...s,
        roomState,
        phase: (roomState.phase as OnlinePhase) ?? s.phase,
      }));
    });

    socket.on('game_started', ({ state: roomState }: { state: PublicOnlineState }) => {
      setState((s) => ({ ...s, roomState, phase: 'ROLE_REVEAL', myRole: null }));
    });

    // Private: only this socket receives its own role
    socket.on('your_role', (info: PrivateRoleInfo) => {
      setState((s) => ({ ...s, myRole: info }));
    });

    socket.on('player_eliminated', (event: EliminationEvent) => {
      setState((s) => ({
        ...s,
        lastElimination: event,
        phase: event.isMrWhite ? 'MR_WHITE_GUESS' : 'ELIMINATION_RESULT',
      }));
    });

    socket.on('mr_white_can_guess', () => {
      setState((s) => ({ ...s, mrWhiteCanGuess: true }));
    });

    socket.on('game_over', ({ state: roomState, results, civilianWord }: {
      state: PublicOnlineState; results: PlayerResult[]; civilianWord: string;
    }) => {
      setState((s) => ({
        ...s,
        roomState,
        phase: 'GAME_OVER',
        gameResults: results,
        civilianWord,
      }));
      clearSession();
    });

    socket.on('room_error', ({ message }: { message: string }) => {
      setState((s) => ({ ...s, error: message }));
    });

    socket.on('reconnected', ({ state: roomState }: { state: PublicOnlineState }) => {
      setState((s) => ({
        ...s,
        roomState,
        phase: (roomState.phase as OnlinePhase) ?? s.phase,
        error: null,
      }));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('room_updated');
      socket.off('game_started');
      socket.off('your_role');
      socket.off('player_eliminated');
      socket.off('mr_white_can_guess');
      socket.off('game_over');
      socket.off('room_error');
      socket.off('reconnected');
      disconnectSocket();
    };
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const createRoom = useCallback((cfg: OnlineCreateConfig) => {
    setState((s) => ({ ...s, error: null }));
    getSocket().emit('create_room', cfg);
  }, []);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    setState((s) => ({ ...s, error: null }));
    getSocket().emit('join_room', { roomCode: roomCode.toUpperCase(), playerName });
  }, []);

  const leaveRoom = useCallback(() => {
    if (state.roomCode) {
      getSocket().emit('leave_room', { roomCode: state.roomCode });
    }
    clearSession();
    setState(INITIAL);
  }, [state.roomCode]);

  const setReady = useCallback((ready: boolean) => {
    if (!state.roomCode) return;
    getSocket().emit(ready ? 'player_ready' : 'player_unready', { roomCode: state.roomCode });
  }, [state.roomCode]);

  const startGame = useCallback(() => {
    if (!state.roomCode) return;
    getSocket().emit('start_game', { roomCode: state.roomCode });
  }, [state.roomCode]);

  const submitVote = useCallback((targetId: string) => {
    if (!state.roomCode) return;
    getSocket().emit('submit_vote', { roomCode: state.roomCode, targetId });
  }, [state.roomCode]);

  const submitMrWhiteGuess = useCallback((guess: string) => {
    if (!state.roomCode) return;
    getSocket().emit('mr_white_guess', { roomCode: state.roomCode, guess });
  }, [state.roomCode]);

  const advancePhase = useCallback(() => {
    if (!state.roomCode) return;
    getSocket().emit('next_phase', { roomCode: state.roomCode });
  }, [state.roomCode]);

  const copyRoomCode = useCallback(() => {
    if (state.roomCode) navigator.clipboard.writeText(state.roomCode).catch(() => {});
  }, [state.roomCode]);

  const dismissError = useCallback(() => setState((s) => ({ ...s, error: null })), []);

  const isHost = state.playerId !== null && state.roomState?.hostId === state.playerId;

  return {
    ...state,
    isHost,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    submitVote,
    submitMrWhiteGuess,
    advancePhase,
    copyRoomCode,
    dismissError,
  };
}
