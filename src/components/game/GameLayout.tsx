import { PlayerList } from './PlayerList';
import { GameStatus } from './GameStatus';
import { PlayerGuessForm } from './PlayerGuessForm';
import type { Player, Round } from '@/types/game';

type GameLayoutProps = {
  gameState: {
    currentWine: number;
    timeRemaining: number;
    isGuessing: boolean;
    players: Player[];
    currentRound: Round | null;
  };
  isHost: boolean;
  playerId: string;
  onStartGuessing: () => void;
  onPauseGuessing: () => void;
  onGuessSubmitted: () => void;
};

export const GameLayout = ({
  gameState,
  isHost,
  playerId,
  onStartGuessing,
  onPauseGuessing,
  onGuessSubmitted,
}: GameLayoutProps) => {
  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-4xl mx-auto pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <GameStatus
              timeRemaining={gameState.timeRemaining}
              isGuessing={gameState.isGuessing}
              currentWine={gameState.currentWine}
              onStartGuessing={onStartGuessing}
              onPauseGuessing={onPauseGuessing}
              isHost={isHost}
            />
            {gameState.isGuessing && gameState.currentRound && !isHost && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <PlayerGuessForm
                  roundId={gameState.currentRound.id}
                  playerId={playerId}
                  onSubmit={onGuessSubmitted}
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