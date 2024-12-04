import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Wine } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { supabase } from '@/integrations/supabase/client';

const WaitingScreen = () => {
  const { currentRound, currentPlayer } = useGame();
  const navigate = useNavigate();
  const { sessionId } = useParams();

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`waiting_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Game session update in waiting screen:', payload);
          const newData = payload.new as any;
          if (newData.status === 'in_progress') {
            console.log('Game starting, redirecting to game screen');
            navigate(`/game/${sessionId}`);
          }
        }
      )
      .subscribe((status) => {
        console.log('Waiting screen subscription status:', status);
      });

    return () => {
      console.log('Cleaning up waiting screen subscription');
      void supabase.removeChannel(channel);
    };
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-md mx-auto pt-10 animate-fadeIn">
        <div className="text-center mb-8">
          <Wine className="w-16 h-16 text-wine mx-auto mb-4 animate-pulse" />
          <h1 className="text-4xl font-serif text-wine mb-2">Welcome {currentPlayer?.name}!</h1>
          {currentRound ? (
            <p className="text-gray-600">Round {currentRound.number} is in progress</p>
          ) : (
            <p className="text-gray-600">Waiting for the host to start the first round...</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-xl font-serif text-wine mb-4">Get Ready!</p>
          <p className="text-gray-600">
            You'll be tasting 7 different wines across 4 rounds.
            For each wine, you'll need to guess:
          </p>
          <ul className="mt-4 text-left text-gray-600 space-y-2">
            <li>• The country of origin</li>
            <li>• Whether it was chosen by Harri or Silja</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WaitingScreen;