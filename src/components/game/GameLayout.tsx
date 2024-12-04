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
  const [roundGuesses, setRoundGuesses] = useState<Record<string, { roundNumber: number }[]>>({});

  useEffect(() => {
    const fetchPlayerGuesses = async () => {
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

      // Format guesses by player and round number
      const roundGuessesMap = (guesses as PlayerGuess[]).reduce((acc, guess) => {
        const round = gameState.rounds.find(r => r.id === guess.round_id);
        if (!round) return acc;

        if (!acc[guess.player_id]) {
          acc[guess.player_id] = [];
        }
        acc[guess.player_id].push({ roundNumber: round.round_number });
        return acc;
      }, {} as Record<string, { roundNumber: number }[]>);

      setPlayerGuesses(formattedGuesses);
      setRoundGuesses(roundGuessesMap);
    };

    fetchPlayerGuesses();
  }, [gameState.rounds]);

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
            />
          </div>
          <div>
            <PlayerList
              players={gameState.players}
              rounds={gameState.rounds.length}
              playerGuesses={roundGuesses}
              isHost={isHost}
              onEndGame={onEndGame}
            />
          </div>
        </div>
      </div>
    </div>
  );
};