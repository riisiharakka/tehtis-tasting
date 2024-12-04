import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type Player = {
  id: string;
  player_name: string;
  is_host: boolean;
};

export const useGameSession = (sessionId: string) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessionCode, setSessionCode] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let channel: RealtimeChannel;

    const fetchSessionData = async () => {
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('code, status')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        toast({
          title: "Error fetching session",
          description: "Could not load the session details.",
          variant: "destructive",
        });
        return;
      }

      if (sessionData) {
        setSessionCode(sessionData.code);
        if (sessionData.status === 'in_progress') {
          navigate(`/game/${sessionId}`);
        }
      }
    };

    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('game_players')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });

      if (error) {
        toast({
          title: "Error fetching players",
          description: "Could not load the player list.",
          variant: "destructive",
        });
        return;
      }

      setPlayers(data);
    };

    const setupRealtimeSubscription = () => {
      channel = supabase.channel(`game_${sessionId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        }, (payload) => {
          const newData = payload.new as Database['public']['Tables']['game_sessions']['Row'];
          if (newData.status === 'in_progress') {
            navigate(`/game/${sessionId}`);
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `session_id=eq.${sessionId}`,
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setPlayers((current) => [...current, payload.new as Player]);
          } else if (payload.eventType === 'DELETE') {
            setPlayers((current) =>
              current.filter((player) => player.id !== payload.old.id)
            );
          }
        });

      channel.subscribe();
    };

    fetchSessionData();
    fetchPlayers();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [sessionId, toast, navigate]);

  return {
    players,
    sessionCode,
  };
};