import { useState, useCallback } from 'react';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { useSessionData } from './useSessionData';
import type { Player } from '@/types/game';

export function useGameSession(sessionId: string) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessionCode, setSessionCode] = useState<string>('');

  useSessionData(sessionId, setPlayers, setSessionCode);
  useRealtimeSubscription(sessionId, setPlayers);

  return {
    players,
    sessionCode,
  };
}