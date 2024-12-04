import { useState } from 'react';
import { Wine, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Round } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

type RoundsListProps = {
  rounds: Round[];
  playerId: string;
  onGuessSubmitted: (roundId: string, country: string, selector: string) => void;
  isGameEnded: boolean;
};

export const RoundsList = ({
  rounds,
  playerId,
  onGuessSubmitted,
  isGameEnded,
}: RoundsListProps) => {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [guesses, setGuesses] = useState<Record<string, { country: string; selector: string }>>({});
  const { toast } = useToast();

  const handleSubmit = async (roundId: string) => {
    const guess = guesses[roundId];
    if (guess) {
      // Check if a guess already exists
      const { data: existingGuess } = await supabase
        .from('player_guesses')
        .select('id')
        .eq('player_id', playerId)
        .eq('round_id', roundId)
        .single();

      if (existingGuess) {
        // Update existing guess
        const { error } = await supabase
          .from('player_guesses')
          .update({
            guessed_country: guess.country,
            guessed_selector: guess.selector,
          })
          .eq('id', existingGuess.id);

        if (error) {
          toast({
            title: "Error updating guess",
            description: "There was a problem updating your guess.",
            variant: "destructive",
          });
          return;
        }
      }

      onGuessSubmitted(roundId, guess.country, guess.selector);
      if (currentRoundIndex < rounds.length - 1) {
        setCurrentRoundIndex(prev => prev + 1);
      }
    }
  };

  const goToPreviousRound = () => {
    if (currentRoundIndex > 0) {
      setCurrentRoundIndex(prev => prev - 1);
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
            <Select
              value={guesses[currentRound.id]?.country || ''}
              onValueChange={(value) =>
                setGuesses((prev) => ({
                  ...prev,
                  [currentRound.id]: { ...prev[currentRound.id], country: value },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Italy">Italy</SelectItem>
                <SelectItem value="Spain">Spain</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="Portugal">Portugal</SelectItem>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="Argentina">Argentina</SelectItem>
                <SelectItem value="Chile">Chile</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="South Africa">South Africa</SelectItem>
                <SelectItem value="Japan">Japan</SelectItem>
                <SelectItem value="Finland">Finland</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Selected by</label>
            <Select
              value={guesses[currentRound.id]?.selector || ''}
              onValueChange={(value) =>
                setGuesses((prev) => ({
                  ...prev,
                  [currentRound.id]: { ...prev[currentRound.id], selector: value },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select who chose this wine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Harri">Harri</SelectItem>
                <SelectItem value="Silja">Silja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => handleSubmit(currentRound.id)}
              className="w-full bg-wine hover:bg-wine/90 text-white"
              disabled={!guesses[currentRound.id]?.country || !guesses[currentRound.id]?.selector}
            >
              Submit Guess
            </Button>

            {currentRoundIndex > 0 && (
              <Button
                onClick={goToPreviousRound}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Previous Round
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};