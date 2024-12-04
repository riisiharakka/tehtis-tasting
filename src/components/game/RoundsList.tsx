import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Round } from '@/types/game';
import { RoundDisplay } from './RoundDisplay';
import { GuessFormSection } from './GuessFormSection';

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

  // Validate playerId when component mounts
  useEffect(() => {
    if (!playerId) {
      console.error('No player ID available');
      toast({
        title: "Error",
        description: "Player ID is missing. Please try rejoining the game.",
        variant: "destructive",
      });
    }
  }, [playerId, toast]);

  const handleSubmit = async (roundId: string) => {
    if (!playerId) {
      console.error('Attempting to submit without player ID');
      toast({
        title: "Error",
        description: "Player ID is missing. Please try rejoining the game.",
        variant: "destructive",
      });
      return;
    }

    const guess = guesses[roundId];
    if (guess) {
      try {
        console.log('Submitting guess for player:', playerId, 'round:', roundId);
        
        // Check if a guess already exists
        const { data: existingGuess, error } = await supabase
          .from('player_guesses')
          .select('id')
          .eq('player_id', playerId)
          .eq('round_id', roundId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking existing guess:', error);
          toast({
            title: "Error checking existing guess",
            description: "There was a problem checking your existing guess.",
            variant: "destructive",
          });
          return;
        }

        if (existingGuess) {
          // Update existing guess
          const { error: updateError } = await supabase
            .from('player_guesses')
            .update({
              guessed_country: guess.country,
              guessed_selector: guess.selector,
            })
            .eq('id', existingGuess.id);

          if (updateError) {
            console.error('Error updating guess:', updateError);
            toast({
              title: "Error updating guess",
              description: "There was a problem updating your guess.",
              variant: "destructive",
            });
            return;
          }
        } else {
          // Insert new guess
          const { error: insertError } = await supabase
            .from('player_guesses')
            .insert({
              player_id: playerId,
              round_id: roundId,
              guessed_country: guess.country,
              guessed_selector: guess.selector,
            });

          if (insertError) {
            console.error('Error inserting guess:', insertError);
            toast({
              title: "Error submitting guess",
              description: "There was a problem submitting your guess.",
              variant: "destructive",
            });
            return;
          }
        }

        onGuessSubmitted(roundId, guess.country, guess.selector);
        if (currentRoundIndex < rounds.length - 1) {
          setCurrentRoundIndex(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error handling guess submission:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
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
          <RoundDisplay
            key={round.id}
            roundNumber={round.round_number}
            correctCountry={round.correct_country}
            wineSelector={round.wine_selector}
            isGameEnded={true}
          />
        ))}
      </div>
    );
  }

  const currentRound = rounds[currentRoundIndex];
  if (!currentRound) return null;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <RoundDisplay
          roundNumber={currentRound.round_number}
          isGameEnded={false}
        />

        <GuessFormSection
          currentRound={currentRound}
          guesses={guesses}
          setGuesses={setGuesses}
          onSubmit={() => handleSubmit(currentRound.id)}
          onBack={goToPreviousRound}
          showBackButton={currentRoundIndex > 0}
        />
      </div>
    </div>
  );
};