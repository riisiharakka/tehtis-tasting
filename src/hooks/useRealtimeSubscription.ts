import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type { Player } from '@/types/game';

export function useRealtimeSubscription(
  sessionId: string,
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
) {
  const navigate = useNavigate();

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      channel = supabase.channel(`game_${sessionId}`);

      // Subscribe to game session changes
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_sessions',
            filter: `id=eq.${sessionId}`,
          },
          (payload) => {
            console.log('Game session update in subscription:', payload);
            const newData = payload.new as Database['public']['Tables']['game_sessions']['Row'];
            
            // Redirect to game screen when status changes to in_progress or tasting
            if (newData.status === 'in_progress' || newData.status === 'tasting') {
              console.log('Status changed, redirecting to game screen');
              navigate(`/game/${sessionId}`);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_players',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            console.log('Player update:', payload);
            if (payload.eventType === 'INSERT') {
              setPlayers((current) => [...current, payload.new as Player]);
            } else if (payload.eventType === 'DELETE') {
              setPlayers((current) =>
                current.filter((player) => player.id !== payload.old.id)
              );
            }
          }
        );

      await channel.subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        console.log('Cleaning up realtime subscription');
        void supabase.removeChannel(channel);
      }
    };
  }, [sessionId, setPlayers, navigate]);
}