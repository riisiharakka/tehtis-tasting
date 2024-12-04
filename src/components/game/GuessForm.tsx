import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

type GuessFormProps = {
  roundId: string;
  playerId: string;
  onSubmit: () => void;
};

export const GuessForm = ({ roundId, playerId, onSubmit }: GuessFormProps) => {
  const [country, setCountry] = useState('');
  const [selector, setSelector] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!country || !selector) {
      toast({
        title: "Missing fields",
        description: "Please select both a country and who selected the wine.",
        variant: "destructive",
      });
      return;
    }

    try {
      await supabase
        .from('player_guesses')
        .insert({
          player_id: playerId,
          round_id: roundId,
          guessed_country: country,
          guessed_selector: selector,
        });

      toast({
        title: "Guess submitted!",
        description: "Your guess has been recorded.",
      });
      
      onSubmit();
    } catch (error) {
      toast({
        title: "Error submitting guess",
        description: "There was a problem submitting your guess. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Wine Origin</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
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
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Selected By</Label>
          <RadioGroup value={selector} onValueChange={setSelector}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Harri" id="harri" />
              <Label htmlFor="harri">Harri</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Silja" id="silja" />
              <Label htmlFor="silja">Silja</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <Button type="submit" className="w-full bg-wine hover:bg-wine-light">
        Submit Guess
      </Button>
    </form>
  );
};