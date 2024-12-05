import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Flag } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
                'Australia',
                'Chile',
                'Finland',
                'France',
                'Germany',
                'Italy',
                'Japan',
                'Korea',
                'Portugal',
                'Spain',
                'USA',
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

        <div>
          <Label className="mb-3 block">Who selected the wine?</Label>
          <RadioGroup value={selector} onValueChange={setSelector}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Harri', image: '/lovable-uploads/140e8eea-aa63-4cf5-b47a-3673b9f5ec56.png' },
                { name: 'Silja', image: '/lovable-uploads/fcce27ab-cc94-471f-9a84-aec3087b387b.png' }
              ].map(({ name, image }) => (
                <Label
                  key={name}
                  htmlFor={name.toLowerCase()}
                  className={`
                    block p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selector === name 
                      ? 'border-wine bg-wine/10 shadow-md' 
                      : 'border-gray-200 hover:border-wine/50'}
                  `}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={image} alt={name} className="object-cover" />
                      <AvatarFallback>{name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center justify-center space-x-2">
                      <RadioGroupItem value={name} id={name.toLowerCase()} />
                      <span className="cursor-pointer">
                        {name}
                      </span>
                    </div>
                  </div>
                </Label>
              ))}
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