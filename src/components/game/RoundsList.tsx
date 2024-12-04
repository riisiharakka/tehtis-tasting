import { useState } from 'react';
import { Wine } from 'lucide-react';
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
  const [guesses, setGuesses] = useState<Record<string, { country: string; selector: string }>>({});

  const handleSubmit = (roundId: string) => {
    const guess = guesses[roundId];
    if (guess) {
      onGuessSubmitted(roundId, guess.country, guess.selector);
      if (currentRoundIndex < rounds.length - 1) {
        setCurrentRoundIndex(prev => prev + 1);
      }
    }
  };

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

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Wine className="w-8 h-8 text-wine" />
          <h2 className="text-2xl font-serif text-wine">Round {currentRound.round_number}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-wine focus:ring-wine"
              onChange={(e) =>
                setGuesses((prev) => ({
                  ...prev,
                  [currentRound.id]: { ...prev[currentRound.id], country: e.target.value },
                }))
              }
              value={guesses[currentRound.id]?.country || ''}
            >
              <option value="">Select a country</option>
              <option value="France">France</option>
              <option value="Italy">Italy</option>
              <option value="Germany">Germany</option>
              <option value="Japan">Japan</option>
              <option value="Finland">Finland</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Selected by</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-wine focus:ring-wine"
              onChange={(e) =>
                setGuesses((prev) => ({
                  ...prev,
                  [currentRound.id]: { ...prev[currentRound.id], selector: e.target.value },
                }))
              }
              value={guesses[currentRound.id]?.selector || ''}
            >
              <option value="">Select who chose this wine</option>
              <option value="Harri">Harri</option>
              <option value="Silja">Silja</option>
            </select>
          </div>

          <button
            onClick={() => handleSubmit(currentRound.id)}
            className="w-full bg-wine hover:bg-wine/90 text-white py-2 px-4 rounded-lg"
            disabled={!guesses[currentRound.id]?.country || !guesses[currentRound.id]?.selector}
          >
            Submit Guess
          </button>
        </div>
      </div>
    </div>
  );
};