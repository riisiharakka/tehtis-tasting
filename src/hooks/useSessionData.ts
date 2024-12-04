import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
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
      try {
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
      } catch (error) {
        console.error('Error in fetchSessionData:', error);
      }
    };

    const fetchPlayers = async () => {
      try {
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

        if (data) {
          setPlayers(data);
        }
      } catch (error) {
        console.error('Error in fetchPlayers:', error);
      }
    };

    void fetchSessionData();
    void fetchPlayers();
  }, [sessionId, setSessionCode, setPlayers, toast]);
}