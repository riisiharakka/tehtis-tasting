import { Timer, Wine, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';

type GameStatusProps = {
  timeRemaining: number;
  isGuessing: boolean;
  currentWine: number;
  onStartGuessing: () => void;
  onPauseGuessing: () => void;
  isHost: boolean;
};

export const GameStatus = ({
  timeRemaining,
  isGuessing,
  currentWine,
  onStartGuessing,
  onPauseGuessing,
  isHost,
}: GameStatusProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <Wine className="w-12 h-12 text-wine mx-auto mb-2" />
        <h1 className="text-2xl font-serif text-wine">Wine Tasting</h1>
        <p className="text-gray-600 mt-2">
          Round {currentWine} of 6
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-center gap-4">
          <Timer className="w-6 h-6 text-wine" />
          <span className="text-2xl font-mono">
            {formatTime(timeRemaining)}
          </span>
        </div>

        {isHost && (
          <div className="space-y-4">
            {!isGuessing ? (
              <Button
                onClick={onStartGuessing}
                className="w-full bg-wine hover:bg-wine-light text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Round {currentWine}
              </Button>
            ) : (
              <Button
                onClick={onPauseGuessing}
                className="w-full bg-gold hover:bg-gold-light text-white"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause Round
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};