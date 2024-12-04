import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Flag } from 'lucide-react';

type PlayerGuessFormProps = {
  roundId: string;
  playerId: string;
  onSubmit: () => void;
};

export const PlayerGuessForm = ({ roundId, playerId, onSubmit }: PlayerGuessFormProps) => {
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
      
      // Reset form fields after successful submission
      setCountry('');
      setSelector('');
      
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
              {[
                'France',
                'Italy',
                'Spain',
                'Germany',
                'Portugal',
                'USA',
                'Argentina',
                'Chile',
                'Australia',
                'South Africa',
              ].map((countryName) => (
                <SelectItem key={countryName} value={countryName}>
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-wine" />
                    {countryName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Selected By</Label>
          <div className="grid grid-cols-2 gap-4">
            {['Harri', 'Silja'].map((name) => (
              <div
                key={name}
                className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${selector === name 
                    ? 'border-wine bg-wine/10 shadow-md' 
                    : 'border-gray-200 hover:border-wine/50'}
                `}
                onClick={() => setSelector(name)}
              >
                <RadioGroup value={selector} onValueChange={setSelector}>
                  <div className="flex items-center justify-center space-x-2">
                    <RadioGroupItem value={name} id={name.toLowerCase()} />
                    <Label htmlFor={name.toLowerCase()} className="cursor-pointer">
                      {name}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full bg-wine hover:bg-wine-light">
        Submit Guess
      </Button>
    </form>
  );
};