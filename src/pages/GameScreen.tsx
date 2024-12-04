import { useParams } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { GameLayout } from '@/components/game/GameLayout';
import { useGameState } from '@/hooks/useGameState';
import { useGameActions } from '@/hooks/useGameActions';

const GameScreen = () => {
  const { sessionId } = useParams();
  const { currentPlayer } = useGame();
  const isHost = currentPlayer?.isAdmin;
  
  const { gameState, setGameState } = useGameState(sessionId!);
  const { endGame, submitGuess } = useGameActions(sessionId!);

  const handleGuessSubmitted = (roundId: string, country: string, selector: string) => {
    submitGuess(roundId, currentPlayer?.id || '', country, selector);
  };

  return (
    <GameLayout
      gameState={gameState}
      isHost={!!isHost}
      playerId={currentPlayer?.id || ''}
      onEndGame={endGame}
      onGuessSubmitted={handleGuessSubmitted}
    />
  );
};

export default GameScreen;