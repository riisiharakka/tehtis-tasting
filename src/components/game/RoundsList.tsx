import { useState } from 'react';
import { Wine } from 'lucide-react';
import { PlayerGuessForm } from './PlayerGuessForm';
import type { Round } from '@/types/game';

type RoundsListProps = {
  rounds: Round[];
  playerId: string;
  onGuessSubmitted: (roundId: string, country: string, selector: string) => void;
  isGameEnded: boolean;
  isHost: boolean;
};

export const RoundsList = ({
  rounds,
  playerId,
  onGuessSubmitted,
  isGameEnded,
  isHost,
}: RoundsListProps) => {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  if (isGameEnded) {
    return (
      <div className="space-y-4">
        {rounds.map((round) => (
          <div key={round.id} className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <Wine className="w-8 h-8 text-wine" />
              <h2 className="text-2xl font-serif text-wine">Round {round.round_number}</h2>
            </div>
            <div className="space-y-2">
              <p className="text-lg">Correct Answer:</p>
              <p className="font-bold">Country: {round.correct_country}</p>
              <p className="font-bold">Selected by: {round.wine_selector}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const currentRound = rounds[currentRoundIndex];
  if (!currentRound) return null;

  const handleSubmit = () => {
    if (currentRoundIndex < rounds.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Wine className="w-8 h-8 text-wine" />
          <h2 className="text-2xl font-serif text-wine">Round {currentRound.round_number}</h2>
        </div>

        <PlayerGuessForm
          roundId={currentRound.id}
          playerId={playerId}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};