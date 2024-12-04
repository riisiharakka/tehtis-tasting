import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Player, Round } from '@/types/game';

export function useGameState(sessionId: string) {
  const { toast } = useToast();
  const [gameState, setGameState] = useState({
    players: [] as Player[],
    rounds: [] as Round[],
    isGameEnded: false
  });

  useEffect(() => {
    const fetchGameData = async () => {
      if (!sessionId) return;

      // Fetch rounds
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select('*')
        .eq('session_id', sessionId)
        .order('round_number', { ascending: true });

      if (roundsError) {
        console.error('Error fetching rounds:', roundsError);
        toast({
          title: "Error fetching rounds",
          description: "Could not load the rounds.",
          variant: "destructive",
        });
        return;
      }

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from('game_players')
        .select('*')
        .eq('session_id', sessionId);

      if (playersError) {
        console.error('Error fetching players:', playersError);
        toast({
          title: "Error fetching players",
          description: "Could not load the players.",
          variant: "destructive",
        });
        return;
      }

      setGameState(prev => ({
        ...prev,
        rounds: roundsData || [],
        players: playersData || []
      }));
    };

    fetchGameData();

    const channel = supabase
      .channel(`game_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_guesses',
        },
        () => {
          fetchGameData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, toast]);

  return {
    gameState,
    setGameState,
  };
}