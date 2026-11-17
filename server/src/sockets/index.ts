import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { config } from '../config/env';
import { registerRoomHandlers, handlePlayerLeave } from './roomHandlers';
import { registerGameHandlers } from './gameHandlers';

export function createSocketServer(httpServer: HTTPServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
    path: '/socket.io',
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  io.on('connection', (socket) => {
    // Register domain handlers
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);

    socket.on('ping', () => socket.emit('pong', { time: Date.now() }));

    socket.on('disconnect', () => {
      const roomCode = socket.data.roomCode as string | undefined;
      if (roomCode) {
        handlePlayerLeave(io, socket, roomCode);
      }
    });
  });

  console.log('✅  Socket.IO server ready');
  return io;
}
