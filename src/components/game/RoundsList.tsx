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

  useEffect(() => {
    console.log('RoundsList mounted with playerId:', playerId);
    if (!playerId) {
      console.error('No player ID available');
      toast({
        title: "Error",
        description: "Player ID is missing. Please try rejoining the game.",
        variant: "destructive",
      });
      return;
    }

    // Fetch existing guesses for this player
    const fetchExistingGuesses = async () => {
      try {
        const { data, error } = await supabase
          .from('player_guesses')
          .select('*')
          .eq('player_id', playerId);

        if (error) {
          console.error('Error fetching existing guesses:', error);
          return;
        }

        if (data) {
          const formattedGuesses = data.reduce((acc, guess) => ({
            ...acc,
            [guess.round_id]: {
              country: guess.guessed_country,
              selector: guess.guessed_selector,
            },
          }), {});
          setGuesses(formattedGuesses);
        }
      } catch (error) {
        console.error('Error in fetchExistingGuesses:', error);
      }
    };

    fetchExistingGuesses();
  }, [playerId, toast]);

  const handleSubmit = async (roundId: string) => {
    console.log('Handling submit for round:', roundId, 'with playerId:', playerId);
    
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
    if (!guess) {
      console.error('No guess data available for submission');
      return;
    }

    try {
      console.log('Submitting guess:', { roundId, playerId, guess });
      
      // Check if a guess already exists
      const { data: existingGuess, error: checkError } = await supabase
        .from('player_guesses')
        .select('id')
        .eq('player_id', playerId)
        .eq('round_id', roundId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing guess:', checkError);
        throw checkError;
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

        if (updateError) throw updateError;
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

        if (insertError) throw insertError;
      }

      onGuessSubmitted(roundId, guess.country, guess.selector);
      
      if (currentRoundIndex < rounds.length - 1) {
        setCurrentRoundIndex(prev => prev + 1);
      }

      toast({
        title: "Success",
        description: "Your guess has been submitted!",
      });
    } catch (error) {
      console.error('Error submitting guess:', error);
      toast({
        title: "Error",
        description: "There was a problem submitting your guess. Please try again.",
        variant: "destructive",
      });
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