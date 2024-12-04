import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

type GuessFormSectionProps = {
  currentRound: {
    id: string;
    round_number: number;
  };
  guesses: Record<string, { country: string; selector: string }>;
  setGuesses: React.Dispatch<React.SetStateAction<Record<string, { country: string; selector: string }>>>;
  onSubmit: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
};

export const GuessFormSection = ({
  currentRound,
  guesses,
  setGuesses,
  onSubmit,
  onBack,
  showBackButton,
}: GuessFormSectionProps) => {
  const { toast } = useToast();

  const handleSubmit = async () => {
    const currentGuess = guesses[currentRound.id];
    if (!currentGuess?.country || !currentGuess?.selector) {
      toast({
        title: "Missing fields",
        description: "Please select both a country and who selected the wine.",
        variant: "destructive",
      });
      return;
    }

    try {
      onSubmit();
    } catch (error) {
      console.error('Error submitting guess:', error);
      toast({
        title: "Error",
        description: "Could not submit your guess. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
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
          onClick={handleSubmit}
          className="w-full bg-wine hover:bg-wine/90 text-white"
          disabled={!guesses[currentRound.id]?.country || !guesses[currentRound.id]?.selector}
        >
          Submit Guess
        </Button>

        {showBackButton && onBack && (
          <Button
            onClick={onBack}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Previous Round
          </Button>
        )}
      </div>
    </div>
  );
};