import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRoundManagement } from './useRoundManagement';
import type { Player, Round } from '@/types/game';

export function useGameLogic(sessionId: string, isHost: boolean) {
  const { toast } = useToast();
  const { createNewRound } = useRoundManagement();
  const [gameState, setGameState] = useState({
    currentWine: 1,
    timeRemaining: 120,
    isGuessing: false,
    players: [] as Player[],
    currentRound: null as Round | null,
  });

  useEffect(() => {
    const fetchGameData = async () => {
      if (!sessionId) return;

      console.log('Fetching game data for session:', sessionId);
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('status')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        toast({
          title: "Error fetching session",
          description: "Could not load the game session.",
          variant: "destructive",
        });
        return;
      }

      if (sessionData.status === 'tasting') {
        setGameState(prev => ({
          ...prev,
          isGuessing: true
        }));
      }
    };

    const fetchPlayers = async () => {
      if (!sessionId) return;

      console.log('Fetching players for session:', sessionId);
      const { data, error } = await supabase
        .from('game_players')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching players:', error);
        toast({
          title: "Error fetching players",
          description: "Could not load the player list.",
          variant: "destructive",
        });
        return;
      }

      const { data: roundData, error: roundError } = await supabase
        .from('rounds')
        .select('*')
        .eq('session_id', sessionId)
        .order('round_number', { ascending: false })
        .limit(1);

      if (roundError) {
        console.error('Error fetching rounds:', roundError);
      }

      setGameState(prev => ({
        ...prev,
        players: data || [],
        currentRound: roundData?.[0] || null,
        currentWine: roundData?.[0]?.round_number || 1,
      }));
    };

    fetchGameData();
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
          console.log('Game session update in GameScreen:', payload);
          const newData = payload.new as any;
          if (newData.status === 'tasting') {
            setGameState(prev => ({
              ...prev,
              isGuessing: true,
            }));
          } else if (newData.status === 'paused') {
            setGameState(prev => ({
              ...prev,
              isGuessing: false,
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rounds',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newRound = payload.new as Round;
          setGameState(prev => ({
            ...prev,
            currentRound: newRound,
            currentWine: newRound.round_number,
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_guesses',
        },
        () => {
          fetchPlayers();
        }
      )
      .subscribe((status) => {
        console.log('GameScreen subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, toast]);

  const startGuessing = async () => {
    if (!isHost || !sessionId) return;

    try {
      const newRound = await createNewRound(sessionId, gameState.currentWine);

      const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({ status: 'tasting' })
        .eq('id', sessionId);

      if (sessionError) {
        console.error('Error updating session status:', sessionError);
        throw sessionError;
      }

      setGameState(prev => ({
        ...prev,
        isGuessing: true,
        currentRound: newRound,
      }));

      toast({
        title: "Round Started",
        description: `Round ${gameState.currentWine} has begun!`,
      });
    } catch (error) {
      console.error('Error starting round:', error);
      toast({
        title: "Error",
        description: "Could not start the round.",
        variant: "destructive",
      });
    }
  };

  const pauseGuessing = async () => {
    if (!isHost || !sessionId) return;

    try {
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({ status: 'paused' })
        .eq('id', sessionId);

      if (sessionError) {
        console.error('Error pausing session:', sessionError);
        throw sessionError;
      }

      setGameState(prev => ({
        ...prev,
        isGuessing: false,
      }));

      toast({
        title: "Round Paused",
        description: "The round has been paused.",
      });
    } catch (error) {
      console.error('Error pausing round:', error);
      toast({
        title: "Error",
        description: "Could not pause the round.",
        variant: "destructive",
      });
    }
  };

  return {
    gameState,
    startGuessing,
    pauseGuessing,
    setGameState,
  };
}