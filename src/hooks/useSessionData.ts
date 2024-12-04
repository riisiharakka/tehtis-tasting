import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Player } from '@/types/game';

export function useSessionData(
  sessionId: string,
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>,
  setSessionCode: React.Dispatch<React.SetStateAction<string>>
) {
  const { toast } = useToast();

  useEffect(() => {
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

    fetchSessionData();
    fetchPlayers();
  }, [sessionId, setSessionCode, setPlayers, toast]);
}