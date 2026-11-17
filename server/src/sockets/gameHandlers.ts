/**
 * In-game socket handlers: voting, Mr. White guess, phase control.
 */

import type { Server, Socket } from 'socket.io';
import { getRoom, setRoom } from '../game/roomStore';
import {
  validateServerVote,
  tallyServerVotes,
  resolveServerElimination,
  evaluateServerWinCondition,
  buildPublicState,
  advanceServerWordPair,
  buildPrivateRoleInfo,
} from '../game/gameLogic';
import { buildGameOverPayload } from './roomHandlers';
import { VoteSchema, MrWhiteGuessSchema, RoomCodeSchema } from '../utils/validators';
import type { ServerRoom } from '../game/types';

function getPlayerId(socket: Socket): string | undefined {
  return socket.data.playerId as string | undefined;
}

export function registerGameHandlers(io: Server, socket: Socket): void {

  // ── SUBMIT_VOTE ────────────────────────────────────────────────────────────
  socket.on('submit_vote', (raw: unknown) => {
    const parsed = VoteSchema.safeParse(raw);
    if (!parsed.success) {
      socket.emit('room_error', { message: 'Invalid vote.' });
      return;
    }
    const { roomCode, targetId } = parsed.data;

    const room = getRoom(roomCode);
    const pid = getPlayerId(socket);
    if (!room || !pid || room.phase !== 'VOTING') {
      socket.emit('room_error', { message: 'Voting is not open right now.' });
      return;
    }

    const alivePlayers = room.gamePlayers.filter((p) => p.isAlive);
    const error = validateServerVote(pid, targetId, room.votes, alivePlayers);
    if (error) {
      socket.emit('room_error', { message: error });
      return;
    }

    room.votes.push({ voterId: pid, targetId });

    const target = room.gamePlayers.find((p) => p.id === targetId);
    if (target) {
      target.votesReceivedThisRound += 1;
      target.totalVotesReceived += 1;
    }

    socket.emit('vote_accepted', { message: 'Vote recorded.' });

    io.to(roomCode).emit('room_updated', {
      state: buildPublicState(room),
      votedCount: room.votes.length,
      totalVoters: alivePlayers.length,
    });

    setRoom(room);

    const allVoted = alivePlayers.map((p) => p.id).every(
      (id) => room.votes.some((v) => v.voterId === id)
    );
    if (allVoted) resolveVoting(io, room, roomCode);
  });

  // ── MR_WHITE_GUESS ─────────────────────────────────────────────────────────
  socket.on('mr_white_guess', (raw: unknown) => {
    const parsed = MrWhiteGuessSchema.safeParse(raw);
    if (!parsed.success) {
      socket.emit('room_error', { message: 'Invalid guess.' });
      return;
    }
    const { roomCode, guess } = parsed.data;

    const room = getRoom(roomCode);
    const pid = getPlayerId(socket);
    if (!room || !pid || room.phase !== 'MR_WHITE_GUESS') {
      socket.emit('room_error', { message: 'Mr. White guess not open.' });
      return;
    }

    const isCorrect =
      guess.trim().toLowerCase() === room.wordPairCivilian.trim().toLowerCase();

    if (isCorrect) {
      room.phase = 'GAME_OVER';
      room.winnerFaction = 'MR_WHITE';
      room.winReason = 'Mr. White guessed the Civilian word correctly!';
      setRoom(room);
      io.to(roomCode).emit('game_over', buildGameOverPayload(room));
      return;
    }

    room.mrWhiteGuessPending = false;
    const winResult = evaluateServerWinCondition(room.gamePlayers);
    if (winResult) {
      room.phase = 'GAME_OVER';
      room.winnerFaction = winResult.winner;
      room.winReason = winResult.reason;
      setRoom(room);
      io.to(roomCode).emit('game_over', buildGameOverPayload(room));
    } else {
      room.phase = 'ELIMINATION_RESULT';
      setRoom(room);
      io.to(roomCode).emit('room_updated', { state: buildPublicState(room) });
    }
  });

  // ── NEXT_PHASE (host-only) ─────────────────────────────────────────────────
  socket.on('next_phase', (raw: unknown) => {
    const parsed = RoomCodeSchema.safeParse(raw);
    if (!parsed.success) return;
    const { roomCode } = parsed.data;

    const room = getRoom(roomCode);
    const pid = getPlayerId(socket);
    if (!room || !pid || room.hostId !== pid) return;

    let refreshPrivateWords = false;
    if (room.phase === 'ROLE_REVEAL') {
      room.phase = 'DISCUSSION';
    } else if (room.phase === 'DISCUSSION') {
      room.gamePlayers.forEach((p) => { p.votesReceivedThisRound = 0; });
      room.votes = [];
      room.phase = 'VOTING';
    } else if (room.phase === 'ELIMINATION_RESULT') {
      advanceServerWordPair(room);
      room.phase = 'DISCUSSION';
      room.round += 1;
      room.lastEliminatedId = null;
      refreshPrivateWords = true;
    }
    setRoom(room);
    io.to(roomCode).emit('room_updated', { state: buildPublicState(room) });
    if (refreshPrivateWords) {
      for (const player of room.gamePlayers) {
        if (player.isAlive) {
          io.to(player.socketId).emit('your_role', buildPrivateRoleInfo(player));
        }
      }
    }
  });
}

// ── Voting resolution ─────────────────────────────────────────────────────────

function resolveVoting(io: Server, room: ServerRoom, roomCode: string): void {
  const alivePlayers = room.gamePlayers.filter((p) => p.isAlive);
  const tally = tallyServerVotes(room.votes, alivePlayers);
  const eliminatedId = resolveServerElimination(tally);

  const eliminated = room.gamePlayers.find((p) => p.id === eliminatedId);
  if (!eliminated) return;

  eliminated.isAlive = false;
  room.lastEliminatedId = eliminatedId;

  // Reveal identity of eliminated player to everyone
  io.to(roomCode).emit('player_eliminated', {
    playerId: eliminatedId,
    playerName: eliminated.name,
    revealedRole: eliminated.role,
    revealedWord: eliminated.word,
    isMrWhite: eliminated.role === 'MR_WHITE',
  });

  if (eliminated.role === 'MR_WHITE') {
    room.phase = 'MR_WHITE_GUESS';
    room.mrWhiteGuessPending = true;
    setRoom(room);
    io.to(roomCode).emit('room_updated', { state: buildPublicState(room) });
    // Private prompt to Mr. White's socket only
    io.to(eliminated.socketId).emit('mr_white_can_guess', {
      message: 'You were eliminated! Guess the Civilian word to win.',
    });
    return;
  }

  const winResult = evaluateServerWinCondition(room.gamePlayers);
  if (winResult) {
    room.phase = 'GAME_OVER';
    room.winnerFaction = winResult.winner;
    room.winReason = winResult.reason;
    setRoom(room);
    io.to(roomCode).emit('game_over', buildGameOverPayload(room));
    return;
  }

  room.phase = 'ELIMINATION_RESULT';
  setRoom(room);
  io.to(roomCode).emit('room_updated', { state: buildPublicState(room) });
}
