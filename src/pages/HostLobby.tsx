import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Play, Copy } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';

type Player = {
  id: string;
  player_name: string;
  is_host: boolean;
};

const HostLobby = () => {
  const { sessionId } = useParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessionCode, setSessionCode] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { startRound: startGameRound } = useGame();

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

    fetchSessionData();
    fetchPlayers();

    // Subscribe to realtime updates for both game_sessions and game_players
    const channel = supabase
      .channel(`game_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new.status === 'in_progress') {
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
  }, [sessionId, toast, navigate]);

  const copySessionCode = async () => {
    await navigator.clipboard.writeText(sessionCode);
    toast({
      title: "Code copied!",
      description: "Share this code with your guests.",
    });
  };

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

      startGameRound(1); // Start round 1

      toast({
        title: "Round started!",
        description: "The wine tasting has begun.",
      });
      
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

          {sessionCode && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="font-medium mb-2">Session Code</h2>
              <div className="flex items-center justify-between bg-white p-3 rounded border">
                <span className="font-mono text-lg">{sessionCode}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copySessionCode}
                  className="text-wine hover:text-wine-light"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Share this code with your guests
              </p>
            </div>
          )}

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