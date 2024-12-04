import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { PlayerList } from '@/components/game/PlayerList';
import { GameStatus } from '@/components/game/GameStatus';
import { PlayerGuessForm } from '@/components/game/PlayerGuessForm';
import type { Database } from '@/integrations/supabase/types';

type Player = {
  id: string;
  player_name: string;
  is_host: boolean;
  hasSubmitted?: boolean;
};

type Round = {
  id: string;
  round_number: number;
};

const GameScreen = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentPlayer } = useGame();
  const [gameState, setGameState] = useState({
    currentWine: 1,
    timeRemaining: 120,
    isGuessing: false,
    players: [] as Player[],
    currentRound: null as Round | null,
  });
  const isHost = currentPlayer?.isAdmin;

  useEffect(() => {
    const fetchGameData = async () => {
      if (!sessionId) return;

      console.log('Fetching game data for session:', sessionId);
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('status')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        toast({
          title: "Error fetching session",
          description: "Could not load the game session.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // Update game state based on session status
      if (sessionData.status === 'waiting') {
        navigate(`/waiting`);
        return;
      } else if (sessionData.status === 'tasting') {
        setGameState(prev => ({
          ...prev,
          isGuessing: true
        }));
      }
    };

    const fetchPlayers = async () => {
      if (!sessionId) return;

      console.log('Fetching players for session:', sessionId);
      const { data, error } = await supabase
        .from('game_players')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching players:', error);
        toast({
          title: "Error fetching players",
          description: "Could not load the player list.",
          variant: "destructive",
        });
        return;
      }

      const { data: roundData, error: roundError } = await supabase
        .from('rounds')
        .select('*')
        .eq('session_id', sessionId)
        .order('round_number', { ascending: false })
        .limit(1);

      if (roundError) {
        console.error('Error fetching rounds:', roundError);
      }

      setGameState(prev => ({
        ...prev,
        players: data || [],
        currentRound: roundData?.[0] || null,
        currentWine: roundData?.[0]?.round_number || 1,
      }));
    };

    fetchGameData();
    fetchPlayers();

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
          console.log('Game session update in GameScreen:', payload);
          const newData = payload.new as Database['public']['Tables']['game_sessions']['Row'];
          if (newData.status === 'tasting') {
            setGameState(prev => ({
              ...prev,
              isGuessing: true,
            }));
          } else if (newData.status === 'paused') {
            setGameState(prev => ({
              ...prev,
              isGuessing: false,
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rounds',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newRound = payload.new as Round;
          setGameState(prev => ({
            ...prev,
            currentRound: newRound,
            currentWine: newRound.round_number,
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_guesses',
        },
        () => {
          fetchPlayers();
        }
      )
      .subscribe((status) => {
        console.log('GameScreen subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, toast, navigate]);

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
    if (!isHost || !sessionId) return;

    try {
      console.log('Creating new round for session:', sessionId);
      
      // Create new round
      const { data: newRound, error: roundError } = await supabase
        .from('rounds')
        .insert({
          session_id: sessionId,
          round_number: gameState.currentWine,
          wine_selector: Math.random() < 0.5 ? 'Harri' : 'Silja',
          correct_country: ['France', 'Italy', 'Spain'][Math.floor(Math.random() * 3)],
        })
        .select()
        .single();

      if (roundError) {
        console.error('Error creating round:', roundError);
        throw roundError;
      }

      console.log('Round created successfully:', newRound);

      // Update session status
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({ status: 'tasting' })
        .eq('id', sessionId);

      if (sessionError) {
        console.error('Error updating session status:', sessionError);
        throw sessionError;
      }

      setGameState(prev => ({
        ...prev,
        isGuessing: true,
        currentRound: newRound,
      }));

      toast({
        title: "Round Started",
        description: `Round ${gameState.currentWine} has begun!`,
      });
    } catch (error) {
      console.error('Error starting round:', error);
      toast({
        title: "Error",
        description: "Could not start the round.",
        variant: "destructive",
      });
    }
  };

  const pauseGuessing = async () => {
    if (!isHost || !sessionId) return;

    try {
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({ status: 'paused' })
        .eq('id', sessionId);

      if (sessionError) {
        console.error('Error pausing session:', sessionError);
        throw sessionError;
      }

      setGameState(prev => ({
        ...prev,
        isGuessing: false,
      }));

      toast({
        title: "Round Paused",
        description: "The round has been paused.",
      });
    } catch (error) {
      console.error('Error pausing round:', error);
      toast({
        title: "Error",
        description: "Could not pause the round.",
        variant: "destructive",
      });
    }
  };

  const handleGuessSubmitted = () => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player => 
        player.id === currentPlayer?.id 
          ? { ...player, hasSubmitted: true }
          : player
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-4xl mx-auto pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <GameStatus
              timeRemaining={gameState.timeRemaining}
              isGuessing={gameState.isGuessing}
              currentWine={gameState.currentWine}
              onStartGuessing={startGuessing}
              onPauseGuessing={pauseGuessing}
              isHost={isHost}
            />
            {gameState.isGuessing && gameState.currentRound && !isHost && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <PlayerGuessForm
                  roundId={gameState.currentRound.id}
                  playerId={currentPlayer?.id || ''}
                  onSubmit={handleGuessSubmitted}
                />
              </div>
            )}
          </div>
          <PlayerList players={gameState.players} />
        </div>
      </div>
    </div>
  );
};

export default GameScreen;