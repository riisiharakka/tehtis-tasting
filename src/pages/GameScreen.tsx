import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { GameLayout } from '@/components/game/GameLayout';
import { useGameLogic } from '@/hooks/useGameLogic';

const GameScreen = () => {
  const { sessionId } = useParams();
  const { currentPlayer } = useGame();
  const isHost = currentPlayer?.isAdmin;
  
  const {
    gameState,
    startGuessing,
    pauseGuessing,
    setGameState,
  } = useGameLogic(sessionId!, isHost);

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
    <GameLayout
      gameState={gameState}
      isHost={isHost}
      playerId={currentPlayer?.id || ''}
      onStartGuessing={startGuessing}
      onPauseGuessing={pauseGuessing}
      onGuessSubmitted={handleGuessSubmitted}
    />
  );
};

export default GameScreen;