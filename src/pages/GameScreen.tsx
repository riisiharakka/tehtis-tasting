import { useParams } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { GameLayout } from '@/components/game/GameLayout';
import { useGameState } from '@/hooks/useGameState';
import { useGameActions } from '@/hooks/useGameActions';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const GameScreen = () => {
  const { sessionId } = useParams();
  const { currentPlayer } = useGame();
  const isHost = currentPlayer?.isAdmin;
  const [playerId, setPlayerId] = useState<string>('');
  
  const { gameState, setGameState } = useGameState(sessionId!);
  const { endGame, submitGuess } = useGameActions(sessionId!);

  useEffect(() => {
    const fetchPlayerId = async () => {
      if (!sessionId || !currentPlayer?.name) return;

      const { data, error } = await supabase
        .from('game_players')
        .select('id')
        .eq('session_id', sessionId)
        .eq('player_name', currentPlayer.name)
        .single();

      if (error) {
        console.error('Error fetching player ID:', error);
        return;
      }

      if (data) {
        console.log('Found player ID:', data.id);
        setPlayerId(data.id);
      }
    };

    fetchPlayerId();
  }, [sessionId, currentPlayer?.name]);

  const handleGuessSubmitted = (roundId: string, country: string, selector: string) => {
    console.log('Submitting guess with:', { roundId, playerId, country, selector });
    if (!playerId) {
      console.error('No player ID available');
      return;
    }
    submitGuess(roundId, playerId, country, selector);
  };

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