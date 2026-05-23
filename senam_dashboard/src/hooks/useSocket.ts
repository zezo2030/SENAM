import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';

let socket: Socket | null = null;
let currentToken: string | null = null;

function getSocket(token: string | null): Socket | null {
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
      currentToken = null;
    }
    return null;
  }
  if (socket && currentToken === token) return socket;

  if (socket) socket.disconnect();
  currentToken = token;
  socket = io(`${import.meta.env.VITE_WS_URL}/ws`, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket'],
  });
  return socket;
}

export function useSocket(): Socket | null {
  const token = useAuthStore((s) => s.accessToken);
  return getSocket(token);
}

export function useOrderRealtime(orderId: string | undefined) {
  const socket = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket || !orderId) return;

    const join = () => socket.emit('subscribe:order', { orderId });
    if (socket.connected) join();
    else socket.once('connect', join);

    const onStatus = (payload: { orderId: string }) => {
      if (payload.orderId !== orderId) return;
      void qc.invalidateQueries({ queryKey: ['admin', 'order', orderId] });
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      void qc.invalidateQueries({ queryKey: ['provider', 'orders'] });
    };
    socket.on('order.status_changed', onStatus);

    return () => {
      socket.off('order.status_changed', onStatus);
    };
  }, [socket, orderId, qc]);
}
