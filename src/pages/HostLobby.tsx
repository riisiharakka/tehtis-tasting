import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Play } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useParams } from 'react-router-dom';
import { PlayerList } from '@/components/lobby/PlayerList';
import { SessionCode } from '@/components/lobby/SessionCode';
import { useGameSession } from '@/hooks/useGameSession';

const HostLobby = () => {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const { startRound: startGameRound } = useGame();
  const { players, sessionCode } = useGameSession(sessionId!);

  const startRound = async () => {
    if (players.length < 2) {
      toast({
        title: "Not enough players",
        description: "Wait for at least one guest to join before starting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ status: 'in_progress' })
        .eq('id', sessionId);

      if (error) throw error;

      startGameRound(1);

      toast({
        title: "Round started!",
        description: "The wine tasting has begun.",
      });
    } catch (error) {
      toast({
        title: "Error starting round",
        description: "Could not start the round. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-md mx-auto pt-10">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <Users className="w-12 h-12 text-wine mx-auto mb-2" />
            <h1 className="text-2xl font-serif text-wine">Host Lobby</h1>
            <p className="text-gray-600 mt-2">Waiting for guests to join...</p>
          </div>

          {sessionCode && <SessionCode code={sessionCode} />}

          <div className="space-y-4">
            <PlayerList players={players} />

            <Button
              onClick={startRound}
              className="w-full bg-wine hover:bg-wine-light text-white"
              disabled={players.length < 2}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Round
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostLobby;