import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Round } from '@/types/game';

export function useRoundManagement() {
  const { toast } = useToast();

  const createNewRound = async (sessionId: string, roundNumber: number) => {
    try {
      // First check if a round already exists
      const { data: existingRound, error: checkError } = await supabase
        .from('rounds')
        .select('*')
        .eq('session_id', sessionId)
        .eq('round_number', roundNumber)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error('Error checking existing round:', checkError);
        throw checkError;
      }

      if (existingRound) {
        console.log('Round already exists:', existingRound);
        return existingRound;
      }

      console.log('Creating new round for session:', sessionId);
      const { data: newRound, error: roundError } = await supabase
        .from('rounds')
        .insert({
          session_id: sessionId,
          round_number: roundNumber,
          wine_selector: Math.random() < 0.5 ? 'Harri' : 'Silja',
          correct_country: ['France', 'Italy', 'Spain'][Math.floor(Math.random() * 3)],
        })
        .select()
        .single();

      if (roundError) {
        console.error('Error creating round:', roundError);
        throw roundError;
      }

      console.log('Round created successfully:', newRound);
      return newRound;
    } catch (error) {
      console.error('Error in createNewRound:', error);
      toast({
        title: "Error",
        description: "Could not create the round.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    createNewRound,
  };
}