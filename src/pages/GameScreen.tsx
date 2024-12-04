import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { PlayerList } from '@/components/game/PlayerList';
import { GameStatus } from '@/components/game/GameStatus';
import { GuessForm } from '@/components/game/GuessForm';
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
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('status')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        toast({
          title: "Error fetching session",
          description: "Could not load the game session.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      if (sessionData.status === 'waiting') {
        navigate(`/waiting`);
        return;
      }
    };

    const fetchPlayers = async () => {
      const { data: playersData, error: playersError } = await supabase
        .from('game_players')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });

      if (playersError) {
        toast({
          title: "Error fetching players",
          description: "Could not load the player list.",
          variant: "destructive",
        });
        return;
      }

      const { data: roundData } = await supabase
        .from('rounds')
        .select('*')
        .eq('session_id', sessionId)
        .order('round_number', { ascending: false })
        .limit(1);

      setGameState(prev => ({
        ...prev,
        players: playersData,
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
          fetchPlayers(); // Refresh player list to update submission status
        }
      )
      .subscribe();

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
    if (isHost) {
      try {
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

        if (roundError) throw roundError;

        await supabase
          .from('game_sessions')
          .update({ status: 'tasting' })
          .eq('id', sessionId);

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
        toast({
          title: "Error",
          description: "Could not start the round.",
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
          title: "Round Paused",
          description: "The round has been paused.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not pause the round.",
          variant: "destructive",
        });
      }
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
                <GuessForm
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