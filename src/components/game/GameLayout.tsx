import { PlayerList } from './PlayerList';
import { RoundsList } from './RoundsList';
import { ScoresScreen } from './ScoresScreen';
import type { Player, Round } from '@/types/game';

type GameLayoutProps = {
  gameState: {
    players: Player[];
    rounds: Round[];
    isGameEnded: boolean;
  };
  isHost: boolean;
  playerId: string;
  onEndGame: () => void;
  onGuessSubmitted: (roundId: string, country: string, selector: string) => void;
};

export const GameLayout = ({
  gameState,
  isHost,
  playerId,
  onEndGame,
  onGuessSubmitted,
}: GameLayoutProps) => {
  if (gameState.isGameEnded) {
    return (
      <ScoresScreen
        players={gameState.players}
        rounds={gameState.rounds}
        playerGuesses={{}} // We'll need to implement this
      />
    );
  }

  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-6xl mx-auto pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RoundsList
              rounds={gameState.rounds}
              playerId={playerId}
              onGuessSubmitted={onGuessSubmitted}
              isGameEnded={gameState.isGameEnded}
            />
          </div>
          <div className="space-y-6">
            <PlayerList players={gameState.players} />
            {isHost && !gameState.isGameEnded && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <button
                  onClick={onEndGame}
                  className="w-full bg-wine hover:bg-wine/90 text-white py-2 px-4 rounded-lg"
                >
                  End Game & Show Scores
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};