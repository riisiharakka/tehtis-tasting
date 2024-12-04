import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Timer, Wine, Trophy } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

type GameState = {
  currentWine: number;
  timeRemaining: number;
  isGuessing: boolean;
};

const GameScreen = () => {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const { currentRound, currentPlayer } = useGame();
  const [gameState, setGameState] = useState<GameState>({
    currentWine: 1,
    timeRemaining: 120, // 2 minutes in seconds
    isGuessing: false,
  });

  useEffect(() => {
    // Subscribe to game session updates
    const channel = supabase
      .channel(`game_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload: RealtimePostgresChangesPayload<{
          [key: string]: any;
        }>) => {
          const newData = payload.new as Database['public']['Tables']['game_sessions']['Row'];
          if (newData.status === 'completed') {
            toast({
              title: "Round Complete!",
              description: "The tasting session has ended.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, toast]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState.isGuessing && gameState.timeRemaining > 0) {
      timer = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState.isGuessing, gameState.timeRemaining]);

  const startGuessing = () => {
    setGameState(prev => ({
      ...prev,
      isGuessing: true,
    }));
  };

  const submitGuess = async () => {
    // Here you would implement the logic to submit the player's guess
    setGameState(prev => ({
      currentWine: prev.currentWine + 1,
      timeRemaining: 120,
      isGuessing: false,
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-md mx-auto pt-10">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <Wine className="w-12 h-12 text-wine mx-auto mb-2" />
            <h1 className="text-2xl font-serif text-wine">Wine Tasting</h1>
            {currentRound && (
              <p className="text-gray-600 mt-2">
                Round {currentRound.number} - Wine {gameState.currentWine}
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-center gap-4">
              <Timer className="w-6 h-6 text-wine" />
              <span className="text-2xl font-mono">
                {formatTime(gameState.timeRemaining)}
              </span>
            </div>

            {!gameState.isGuessing ? (
              <Button
                onClick={startGuessing}
                className="w-full bg-wine hover:bg-wine-light text-white"
              >
                Start Tasting Wine {gameState.currentWine}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-cream-dark rounded-lg">
                  <p className="text-center text-gray-700">
                    Take your time to taste and analyze the wine...
                  </p>
                </div>

                <Button
                  onClick={submitGuess}
                  className="w-full bg-gold hover:bg-gold-light text-white"
                  disabled={gameState.timeRemaining === 0}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Submit Guess
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;