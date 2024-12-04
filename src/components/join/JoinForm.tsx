import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const JoinForm = () => {
  const [name, setName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const { addPlayer } = useGame();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isHost = adminCode === '1234';

  const generateSessionCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleJoin = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to join the tasting.",
        variant: "destructive",
      });
      return;
    }

    if (!isHost && !sessionCode.trim()) {
      toast({
        title: "Session code required",
        description: "Please enter a session code to join the tasting.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isHost) {
        const code = generateSessionCode();
        console.log('Creating new session with code:', code);
        
        const { data: sessionData, error: sessionError } = await supabase
          .from('game_sessions')
          .insert({
            host_id: name,
            code: code,
            status: 'waiting'
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error creating session:', sessionError);
          throw sessionError;
        }

        if (!sessionData) {
          throw new Error('No session data returned after creation');
        }

        console.log('Session created successfully:', sessionData);

        const { error: playerError } = await supabase
          .from('game_players')
          .insert({
            session_id: sessionData.id,
            player_name: name,
            is_host: true
          });

        if (playerError) {
          console.error('Error adding host to players:', playerError);
          throw playerError;
        }

        addPlayer(name, true);
        navigate(`/host-lobby/${sessionData.id}`);
      } else {
        const { data: sessionData, error: sessionError } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('code', sessionCode.toUpperCase())
          .single();

        if (sessionError || !sessionData) {
          toast({
            title: "Invalid session",
            description: "The session code you entered doesn't exist.",
            variant: "destructive",
          });
          return;
        }

        const { error: playerError } = await supabase
          .from('game_players')
          .insert({
            session_id: sessionData.id,
            player_name: name,
            is_host: false
          });

        if (playerError) {
          console.error('Error adding player:', playerError);
          throw playerError;
        }

        addPlayer(name, false);
        navigate('/waiting', { state: { sessionId: sessionData.id } });
      }

      toast({
        title: "Welcome to the wine tasting!",
        description: `Joined as ${isHost ? 'host' : 'guest'}: ${name}`,
      });
    } catch (error) {
      console.error('Error joining session:', error);
      toast({
        title: "Error joining session",
        description: "There was a problem joining the session. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <Input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session Code
          </label>
          <Input
            type="text"
            placeholder={isHost ? "Will be generated automatically" : "Enter the session code to join"}
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value)}
            className="w-full"
            disabled={isHost}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Host Code (optional)
          </label>
          <Input
            type="password"
            placeholder="Enter host code if you're the host"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            className="w-full"
          />
        </div>

        <Button 
          onClick={handleJoin}
          className="w-full bg-wine hover:bg-wine-light text-white"
        >
          Join Tasting
        </Button>
      </div>
    </div>
  );
};