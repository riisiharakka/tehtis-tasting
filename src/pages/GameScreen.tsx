import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/toast';
import { supabase } from '@/integrations/supabase/client';
import { Timer, Wine, Trophy, Users, Play, Pause } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';

type GameState = {
  currentWine: number;
  timeRemaining: number;
  isGuessing: boolean;
  players: Player[];
};

type Player = {
  id: string;
  player_name: string;
  is_host: boolean;
  hasSubmitted?: boolean;
};

const GameScreen = () => {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const { currentRound, currentPlayer } = useGame();
  const [gameState, setGameState] = useState<GameState>({
    currentWine: 1,
    timeRemaining: 120,
    isGuessing: false,
    players: [],
  });
  const isHost = currentPlayer?.isAdmin;

  useEffect(() => {
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

      setGameState(prev => ({
        ...prev,
        players: data,
      }));
    };

    fetchPlayers();

    // Subscribe to game session updates
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
        (payload: RealtimePostgresChangesPayload<{
          [key: string]: any;
        }>) => {
          const newData = payload.new as Database['public']['Tables']['game_sessions']['Row'];
          if (newData.status === 'completed') {
            toast({
              title: "Round Complete!",
              description: "The tasting session has ended.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, toast]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState.isGuessing && gameState.timeRemaining > 0) {
      timer = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState.isGuessing, gameState.timeRemaining]);

  const startGuessing = async () => {
    if (isHost) {
      try {
        await supabase
          .from('game_sessions')
          .update({ status: 'tasting' })
          .eq('id', sessionId);

        setGameState(prev => ({
          ...prev,
          isGuessing: true,
        }));

        toast({
          title: "Tasting Started",
          description: `Wine ${gameState.currentWine} tasting has begun!`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not start the tasting session.",
          variant: "destructive",
        });
      }
    }
  };

  const pauseGuessing = async () => {
    if (isHost) {
      try {
        await supabase
          .from('game_sessions')
          .update({ status: 'paused' })
          .eq('id', sessionId);

        setGameState(prev => ({
          ...prev,
          isGuessing: false,
        }));

        toast({
          title: "Tasting Paused",
          description: "The tasting session has been paused.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not pause the tasting session.",
          variant: "destructive",
        });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-4xl mx-auto pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Game Status Section */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-center mb-6">
              <Wine className="w-12 h-12 text-wine mx-auto mb-2" />
              <h1 className="text-2xl font-serif text-wine">Wine Tasting</h1>
              {currentRound && (
                <p className="text-gray-600 mt-2">
                  Round {currentRound.number} - Wine {gameState.currentWine}
                </p>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-center gap-4">
                <Timer className="w-6 h-6 text-wine" />
                <span className="text-2xl font-mono">
                  {formatTime(gameState.timeRemaining)}
                </span>
              </div>

              {isHost && (
                <div className="space-y-4">
                  {!gameState.isGuessing ? (
                    <Button
                      onClick={startGuessing}
                      className="w-full bg-wine hover:bg-wine-light text-white"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Tasting Wine {gameState.currentWine}
                    </Button>
                  ) : (
                    <Button
                      onClick={pauseGuessing}
                      className="w-full bg-gold hover:bg-gold-light text-white"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Tasting
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Players Section */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-center mb-6">
              <Users className="w-12 h-12 text-wine mx-auto mb-2" />
              <h2 className="text-2xl font-serif text-wine">Players</h2>
              <p className="text-gray-600 mt-2">
                {gameState.players.length} participants
              </p>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <ul className="space-y-2">
                  {gameState.players.map((player) => (
                    <li
                      key={player.id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                    >
                      <span>{player.player_name}</span>
                      <div className="flex items-center gap-2">
                        {player.is_host && (
                          <span className="text-xs bg-wine text-white px-2 py-1 rounded">
                            Host
                          </span>
                        )}
                        {player.hasSubmitted && (
                          <Trophy className="w-4 h-4 text-gold" />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;