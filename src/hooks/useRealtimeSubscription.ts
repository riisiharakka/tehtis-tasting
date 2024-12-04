import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type { Player } from '@/types/game';

export const useRealtimeSubscription = (
  sessionId: string,
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
) => {
  const navigate = useNavigate();

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtimeSubscription = () => {
      channel = supabase.channel(`game_${sessionId}`);

      // Subscribe to game session changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newData = payload.new as Database['public']['Tables']['game_sessions']['Row'];
          if (newData.status === 'in_progress') {
            navigate(`/game/${sessionId}`);
          }
        }
      );

      // Subscribe to player changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPlayers((current) => [...current, payload.new as Player]);
          } else if (payload.eventType === 'DELETE') {
            setPlayers((current) =>
              current.filter((player) => player.id !== payload.old.id)
            );
          }
        }
      );

      channel.subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [sessionId, setPlayers, navigate]);
};