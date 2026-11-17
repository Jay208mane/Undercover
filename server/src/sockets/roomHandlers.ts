/**
 * Room lifecycle socket handlers.
 * CREATE_ROOM, JOIN_ROOM, LEAVE_ROOM, PLAYER_READY, START_GAME, RECONNECT
 */

import type { Server, Socket } from 'socket.io';
import {
  getRoom, setRoom, deleteRoom, generateRoomCode,
} from '../game/roomStore';
import {
  resetServerWordPairCycle, advanceServerWordPair, assignServerRoles,
  buildPublicState, buildPrivateRoleInfo,
} from '../game/gameLogic';
import {
  generateSessionToken, storeToken, validateToken,
} from '../utils/sessionTokens';
import {
  CreateRoomSchema, JoinRoomSchema, RoomCodeSchema, ReconnectSchema,
} from '../utils/validators';
import type { ServerRoom } from '../game/types';

const MAX_PLAYERS = 20;
const MIN_PLAYERS_TO_START = 3;

/** Attach a stable playerId to the socket's data */
function getPlayerId(socket: Socket): string | undefined {
  return socket.data.playerId as string | undefined;
}

export function registerRoomHandlers(io: Server, socket: Socket): void {

  // ── CREATE_ROOM ────────────────────────────────────────────────────────────
  socket.on('create_room', (raw: unknown) => {
    const parsed = CreateRoomSchema.safeParse(raw);
    if (!parsed.success) {
      socket.emit('room_error', { message: 'Invalid room configuration.' });
      return;
    }
    const { playerName, language, category, mrWhiteEnabled, discussionTimerSeconds } = parsed.data;

    const code = generateRoomCode();
    const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const token = generateSessionToken();
    storeToken(playerId, token);

    const room: ServerRoom = {
      code,
      hostId: playerId,
      phase: 'LOBBY',
      lobbyPlayers: [{
        id: playerId,
        socketId: socket.id,
        name: playerName,
        isReady: false,
        isConnected: true,
      }],
      gamePlayers: [],
      votes: [],
      round: 1,
      wordPairCivilian: '',
      wordPairImposter: '',
      wordPairCategory: category,
      wordPairDeckIds: [],
      wordPairDeckIndex: 0,
      language,
      mrWhiteEnabled,
      discussionTimerSeconds,
      revealQueueIndex: 0,
      winnerFaction: null,
      winReason: '',
      lastEliminatedId: null,
      mrWhiteGuessPending: false,
      createdAt: Date.now(),
    };

    setRoom(room);
    socket.data.playerId = playerId;
    socket.data.roomCode = code;
    socket.join(code);

    socket.emit('room_created', {
      roomCode: code,
      playerId,
      sessionToken: token,
      state: buildPublicState(room),
    });
  });

  // ── JOIN_ROOM ──────────────────────────────────────────────────────────────
  socket.on('join_room', (raw: unknown) => {
    const parsed = JoinRoomSchema.safeParse(raw);
    if (!parsed.success) {
      socket.emit('room_error', { message: 'Invalid join request.' });
      return;
    }
    const { roomCode, playerName, sessionToken } = parsed.data;

    const room = getRoom(roomCode);
    if (!room) {
      socket.emit('room_error', { message: 'Room not found. Check the code and try again.' });
      return;
    }
    if (room.phase !== 'LOBBY') {
      // Allow reconnect during active game
      socket.emit('room_error', { message: 'Game already in progress. Use reconnect.' });
      return;
    }
    if (room.lobbyPlayers.length >= MAX_PLAYERS) {
      socket.emit('room_error', { message: 'Room is full.' });
      return;
    }

    const nameTaken = room.lobbyPlayers.some(
      (p) => p.name.toLowerCase() === playerName.toLowerCase()
    );
    if (nameTaken) {
      socket.emit('room_error', { message: 'That name is already taken in this room.' });
      return;
    }

    const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const token = generateSessionToken();
    storeToken(playerId, token);

    room.lobbyPlayers.push({
      id: playerId,
      socketId: socket.id,
      name: playerName,
      isReady: false,
      isConnected: true,
    });
    setRoom(room);

    socket.data.playerId = playerId;
    socket.data.roomCode = roomCode;
    socket.join(roomCode);

    socket.emit('room_joined', {
      roomCode,
      playerId,
      sessionToken: token,
      state: buildPublicState(room),
    });
    // Notify rest of room
    socket.to(roomCode).emit('room_updated', { state: buildPublicState(room) });
  });

  // ── PLAYER_READY ───────────────────────────────────────────────────────────
  socket.on('player_ready', (raw: unknown) => {
    const parsed = RoomCodeSchema.safeParse(raw);
    if (!parsed.success) return;
    const { roomCode } = parsed.data;

    const room = getRoom(roomCode);
    const pid = getPlayerId(socket);
    if (!room || !pid || room.phase !== 'LOBBY') return;

    const lp = room.lobbyPlayers.find((p) => p.id === pid);
    if (!lp) return;
    lp.isReady = true;
    setRoom(room);
    io.to(roomCode).emit('room_updated', { state: buildPublicState(room) });
  });

  socket.on('player_unready', (raw: unknown) => {
    const parsed = RoomCodeSchema.safeParse(raw);
    if (!parsed.success) return;
    const { roomCode } = parsed.data;

    const room = getRoom(roomCode);
    const pid = getPlayerId(socket);
    if (!room || !pid || room.phase !== 'LOBBY') return;

    const lp = room.lobbyPlayers.find((p) => p.id === pid);
    if (!lp) return;
    lp.isReady = false;
    setRoom(room);
    io.to(roomCode).emit('room_updated', { state: buildPublicState(room) });
  });

  // ── START_GAME ─────────────────────────────────────────────────────────────
  socket.on('start_game', (raw: unknown) => {
    const parsed = RoomCodeSchema.safeParse(raw);
    if (!parsed.success) return;
    const { roomCode } = parsed.data;

    const room = getRoom(roomCode);
    const pid = getPlayerId(socket);
    if (!room || !pid) return;

    if (room.hostId !== pid) {
      socket.emit('room_error', { message: 'Only the host can start the game.' });
      return;
    }
    if (room.phase !== 'LOBBY') {
      socket.emit('room_error', { message: 'Game already started.' });
      return;
    }
    if (room.lobbyPlayers.length < MIN_PLAYERS_TO_START) {
      socket.emit('room_error', {
        message: `Need at least ${MIN_PLAYERS_TO_START} players to start.`,
      });
      return;
    }

    // The server owns the shuffled pair cycle so reconnects cannot consume a second pair.
    resetServerWordPairCycle(room);
    advanceServerWordPair(room);

    // Assign roles — server authoritative
    room.gamePlayers = assignServerRoles(room);
    room.phase = 'ROLE_REVEAL';
    room.revealQueueIndex = 0;
    setRoom(room);

    // Broadcast new public phase to all
    io.to(roomCode).emit('game_started', { state: buildPublicState(room) });

    // Send each player their private info
    sendRoleRevealToAll(io, room);
  });

  // ── LEAVE_ROOM ─────────────────────────────────────────────────────────────
  socket.on('leave_room', (raw: unknown) => {
    const parsed = RoomCodeSchema.safeParse(raw);
    if (!parsed.success) return;
    const { roomCode } = parsed.data;

    handlePlayerLeave(io, socket, roomCode);
  });

  // ── RECONNECT ──────────────────────────────────────────────────────────────
  socket.on('reconnect_player', (raw: unknown) => {
    const parsed = ReconnectSchema.safeParse(raw);
    if (!parsed.success) {
      socket.emit('room_error', { message: 'Invalid reconnect request.' });
      return;
    }
    const { roomCode, sessionToken } = parsed.data;

    const room = getRoom(roomCode);
    if (!room) {
      socket.emit('room_error', { message: 'Room no longer exists.' });
      return;
    }

    // Find the player who owns this token
    // We store playerId on socket.data during reconnect attempt
    const candidateId = socket.data.pendingPlayerId as string | undefined;
    if (!candidateId || !validateToken(candidateId, sessionToken)) {
      socket.emit('room_error', { message: 'Session expired. Please join as a new player.' });
      return;
    }

    // Update socketId in lobby and game players
    const lp = room.lobbyPlayers.find((p) => p.id === candidateId);
    if (lp) { lp.socketId = socket.id; lp.isConnected = true; }
    const gp = room.gamePlayers.find((p) => p.id === candidateId);
    if (gp) gp.socketId = socket.id;

    socket.data.playerId = candidateId;
    socket.data.roomCode = roomCode;
    socket.join(roomCode);
    setRoom(room);

    // Send current public state
    socket.emit('reconnected', { state: buildPublicState(room) });

    // Re-send private role info if game is active
    if (gp && room.phase !== 'LOBBY' && room.phase !== 'GAME_OVER') {
      socket.emit('your_role', buildPrivateRoleInfo(gp));
    }

    // Also send final results if game over
    if (room.phase === 'GAME_OVER') {
      socket.emit('game_over', buildGameOverPayload(room));
    }

    io.to(roomCode).emit('room_updated', { state: buildPublicState(room) });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Send each player their private role info (emitted to their individual socket) */
export function sendRoleRevealToAll(io: Server, room: ServerRoom): void {
  for (const gp of room.gamePlayers) {
    const privateInfo = buildPrivateRoleInfo(gp);
    io.to(gp.socketId).emit('your_role', privateInfo);
  }
}

/** Handle a player leaving (voluntary or disconnect) */
export function handlePlayerLeave(io: Server, socket: Socket, roomCode: string): void {
  const room = getRoom(roomCode);
  const pid = socket.data.playerId as string | undefined;
  if (!room || !pid) return;

  if (room.phase === 'LOBBY') {
    room.lobbyPlayers = room.lobbyPlayers.filter((p) => p.id !== pid);

    if (room.lobbyPlayers.length === 0) {
      deleteRoom(roomCode);
      socket.leave(roomCode);
      return;
    }

    // Transfer host if needed
    if (room.hostId === pid) {
      room.hostId = room.lobbyPlayers[0].id;
    }
    setRoom(room);
    socket.leave(roomCode);
    io.to(roomCode).emit('room_updated', { state: buildPublicState(room) });
  } else {
    // During game: mark disconnected but keep in game
    const lp = room.lobbyPlayers.find((p) => p.id === pid);
    if (lp) lp.isConnected = false;
    const gp = room.gamePlayers.find((p) => p.id === pid);
    if (gp) gp.isAlive = false; // simplification: treat as eliminated on hard leave
    setRoom(room);
    socket.leave(roomCode);
    io.to(roomCode).emit('room_updated', { state: buildPublicState(room) });
  }
}

export function buildGameOverPayload(room: ServerRoom): object {
  return {
    state: buildPublicState(room),
    results: room.gamePlayers.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      word: p.word,
      totalVotesReceived: p.totalVotesReceived,
      isAlive: p.isAlive,
    })),
    civilianWord: room.wordPairCivilian,
  };
}
