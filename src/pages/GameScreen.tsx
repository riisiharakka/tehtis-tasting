import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { PlayerList } from '@/components/game/PlayerList';
import { GameStatus } from '@/components/game/GameStatus';
import type { Database } from '@/integrations/supabase/types';

type Player = {
  id: string;
  player_name: string;
  is_host: boolean;
  hasSubmitted?: boolean;
};

const GameScreen = () => {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const { currentRound, currentPlayer } = useGame();
  const [gameState, setGameState] = useState({
    currentWine: 1,
    timeRemaining: 120,
    isGuessing: false,
    players: [] as Player[],
  });
  const isHost = currentPlayer?.isAdmin;

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('game_players')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });

      if (error) {
        toast({
          title: "Error fetching players",
          description: "Could not load the player list.",
          variant: "destructive",
        });
        return;
      }

      setGameState(prev => ({
        ...prev,
        players: data,
      }));
    };

    fetchPlayers();

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
        (payload) => {
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

  const startGuessing = async () => {
    if (isHost) {
      try {
        await supabase
          .from('game_sessions')
          .update({ status: 'tasting' })
          .eq('id', sessionId);

        setGameState(prev => ({
          ...prev,
          isGuessing: true,
        }));

        toast({
          title: "Tasting Started",
          description: `Wine ${gameState.currentWine} tasting has begun!`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not start the tasting session.",
          variant: "destructive",
        });
      }
    }
  };

  const pauseGuessing = async () => {
    if (isHost) {
      try {
        await supabase
          .from('game_sessions')
          .update({ status: 'paused' })
          .eq('id', sessionId);

        setGameState(prev => ({
          ...prev,
          isGuessing: false,
        }));

        toast({
          title: "Tasting Paused",
          description: "The tasting session has been paused.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not pause the tasting session.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-4xl mx-auto pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GameStatus
            timeRemaining={gameState.timeRemaining}
            isGuessing={gameState.isGuessing}
            currentWine={gameState.currentWine}
            onStartGuessing={startGuessing}
            onPauseGuessing={pauseGuessing}
            isHost={isHost}
          />
          <PlayerList players={gameState.players} />
        </div>
      </div>
    </div>
  );
};

export default GameScreen;