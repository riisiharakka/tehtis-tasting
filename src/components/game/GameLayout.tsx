import { useEffect, useState } from 'react';
import { PlayerList } from './PlayerList';
import { RoundsList } from './RoundsList';
import { ScoresScreen } from './ScoresScreen';
import { supabase } from '@/integrations/supabase/client';
import type { Player, Round, PlayerGuess } from '@/types/game';

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
  const [playerGuesses, setPlayerGuesses] = useState<Record<string, { country: string; selector: string; }>>({});

  useEffect(() => {
    const fetchPlayerGuesses = async () => {
      if (!gameState.isGameEnded) return;

      const { data: guesses, error } = await supabase
        .from('player_guesses')
        .select('*')
        .in('round_id', gameState.rounds.map(r => r.id));

      if (error) {
        console.error('Error fetching player guesses:', error);
        return;
      }

      const formattedGuesses = (guesses as PlayerGuess[]).reduce((acc, guess) => {
        acc[`${guess.player_id}-${guess.round_id}`] = {
          country: guess.guessed_country,
          selector: guess.guessed_selector,
        };
        return acc;
      }, {} as Record<string, { country: string; selector: string; }>);

      setPlayerGuesses(formattedGuesses);
    };

    fetchPlayerGuesses();
  }, [gameState.isGameEnded, gameState.rounds]);

  if (gameState.isGameEnded) {
    return (
      <ScoresScreen
        players={gameState.players}
        rounds={gameState.rounds}
        playerGuesses={playerGuesses}
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
              isHost={isHost}
              onEndGame={onEndGame}
            />
          </div>
          <div>
            <PlayerList players={gameState.players} />
          </div>
        </div>
      </div>
    </div>
  );
};