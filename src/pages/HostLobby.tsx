import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Play } from 'lucide-react';

type Player = {
  id: string;
  player_name: string;
  is_host: boolean;
};

const HostLobby = () => {
  const { sessionId } = useParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Initial fetch of players
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

    fetchPlayers();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('game_players_changes')
      .on(
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
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, toast]);

  const startRound = async () => {
    if (players.length < 2) {
      toast({
        title: "Not enough players",
        description: "Wait for at least one guest to join before starting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ status: 'in_progress' })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Round started!",
        description: "The wine tasting has begun.",
      });
      
      // Navigate to the game screen after successful status update
      navigate(`/game/${sessionId}`);
    } catch (error) {
      toast({
        title: "Error starting round",
        description: "Could not start the round. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-md mx-auto pt-10">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <Users className="w-12 h-12 text-wine mx-auto mb-2" />
            <h1 className="text-2xl font-serif text-wine">Host Lobby</h1>
            <p className="text-gray-600 mt-2">Waiting for guests to join...</p>
          </div>

          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h2 className="font-medium mb-3">Players ({players.length})</h2>
              <ul className="space-y-2">
                {players.map((player) => (
                  <li
                    key={player.id}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                  >
                    <span>{player.player_name}</span>
                    {player.is_host && (
                      <span className="text-xs bg-wine text-white px-2 py-1 rounded">
                        Host
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={startRound}
              className="w-full bg-wine hover:bg-wine-light text-white"
              disabled={players.length < 2}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Round
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostLobby;