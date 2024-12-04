import { Wine } from 'lucide-react';

type RoundDisplayProps = {
  roundNumber: number;
  correctCountry?: string;
  wineSelector?: string;
  isGameEnded: boolean;
};

export const RoundDisplay = ({ roundNumber, correctCountry, wineSelector, isGameEnded }: RoundDisplayProps) => {
  if (!isGameEnded) {
    return (
      <div className="flex items-center gap-4 mb-4">
        <Wine className="w-8 h-8 text-wine" />
        <h2 className="text-2xl font-serif text-wine">Round {roundNumber}</h2>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center gap-4 mb-4">
        <Wine className="w-8 h-8 text-wine" />
        <h2 className="text-2xl font-serif text-wine">Round {roundNumber}</h2>
      </div>
      <div className="space-y-2">
        <p className="text-lg">Correct Answer:</p>
        <p className="font-bold">Country: {correctCountry}</p>
        <p className="font-bold">Selected by: {wineSelector}</p>
      </div>
    </div>
  );
};