import { useParams } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { GameLayout } from '@/components/game/GameLayout';
import { useGameState } from '@/hooks/useGameState';
import { useGameActions } from '@/hooks/useGameActions';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const GameScreen = () => {
  const { sessionId } = useParams();
  const { currentPlayer } = useGame();
  const isHost = currentPlayer?.isAdmin;
  const [playerId, setPlayerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  const { gameState, setGameState } = useGameState(sessionId!);
  const { endGame, submitGuess } = useGameActions(sessionId!);

  useEffect(() => {
    const fetchPlayerId = async () => {
      if (!sessionId || !currentPlayer?.name) {
        console.error('Missing sessionId or player name');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching player ID for:', { sessionId, playerName: currentPlayer.name });
        const { data, error } = await supabase
          .from('game_players')
          .select('id')
          .eq('session_id', sessionId)
          .eq('player_name', currentPlayer.name)
          .single();

        if (error) {
          console.error('Error fetching player ID:', error);
          setIsLoading(false);
          return;
        }

        if (data) {
          console.log('Found player ID:', data.id);
          setPlayerId(data.id);
        }
      } catch (error) {
        console.error('Error in fetchPlayerId:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerId();

    // Subscribe to game session status changes
    const channel = supabase
      .channel(`game_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload: any) => {
          console.log('Game session update:', payload);
          if (payload.new.status === 'ended') {
            setGameState(prev => ({
              ...prev,
              isGameEnded: true
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, currentPlayer?.name, setGameState]);

  const handleGuessSubmitted = (roundId: string, country: string, selector: string) => {
    console.log('Submitting guess with:', { roundId, playerId, country, selector });
    if (!playerId) {
      console.error('No player ID available');
      return;
    }
    submitGuess(roundId, playerId, country, selector);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-wine animate-spin" />
      </div>
    );
  }

  if (!playerId) {
    return (
      <div className="min-h-screen bg-cream p-4">
        <div className="max-w-md mx-auto mt-10">
          <div className="bg-red-500 text-white p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>Player ID is missing. Please try rejoining the game.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GameLayout
      gameState={gameState}
      isHost={!!isHost}
      playerId={playerId}
      onEndGame={endGame}
      onGuessSubmitted={handleGuessSubmitted}
    />
  );
};

export default GameScreen;