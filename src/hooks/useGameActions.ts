import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useGameActions(sessionId: string) {
  const { toast } = useToast();

  const endGame = async () => {
    try {
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({ status: 'ended' })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      toast({
        title: "Game Ended",
        description: "The game has been ended. Check the scores!",
      });
    } catch (error) {
      console.error('Error ending game:', error);
      toast({
        title: "Error",
        description: "Could not end the game.",
        variant: "destructive",
      });
    }
  };

  const submitGuess = async (roundId: string, playerId: string, country: string, selector: string) => {
    try {
      console.log('Submitting guess with:', { roundId, playerId, country, selector });
      
      const { error } = await supabase
        .from('player_guesses')
        .insert({
          round_id: roundId,
          player_id: playerId,
          guessed_country: country,
          guessed_selector: selector,
        });

      if (error) {
        console.error('Error details:', error);
        throw error;
      }

      toast({
        title: "Guess Submitted",
        description: "Your guess has been recorded!",
      });
    } catch (error) {
      console.error('Error submitting guess:', error);
      toast({
        title: "Error",
        description: "Could not submit your guess.",
        variant: "destructive",
      });
    }
  };

  return {
    endGame,
    submitGuess,
  };
}