import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [name, setName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const { addPlayer } = useGame();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isHost = adminCode === '1234';

  const generateSessionCode = () => {
    // Generate a 6-character alphanumeric code
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
        const generatedCode = isHost ? generateSessionCode() : sessionCode;
        
        // Create a new game session with the host's chosen code
        const { data: sessionData, error: sessionError } = await supabase
          .from('game_sessions')
          .insert([
            { 
              host_id: name,
              code: generatedCode
            }
          ])
          .select()
          .single();

        if (sessionError) throw sessionError;

        // Add host to game_players
        const { error: playerError } = await supabase
          .from('game_players')
          .insert([
            {
              session_id: sessionData.id,
              player_name: name,
              is_host: true
            }
          ]);

        if (playerError) throw playerError;

        addPlayer(name, true);
        navigate(`/host-lobby/${sessionData.id}`);
      } else {
        // Verify session exists
        const { data: sessionData, error: sessionError } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('code', sessionCode)
          .single();

        if (sessionError || !sessionData) {
          toast({
            title: "Invalid session",
            description: "The session code you entered doesn't exist.",
            variant: "destructive",
          });
          return;
        }

        // Add player to existing session
        const { error: playerError } = await supabase
          .from('game_players')
          .insert([
            {
              session_id: sessionData.id,
              player_name: name,
              is_host: false
            }
          ]);

        if (playerError) throw playerError;

        addPlayer(name, false);
        navigate('/waiting');
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
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-md mx-auto pt-10 animate-fadeIn">
        <div className="text-center mb-8">
          <Wine className="w-16 h-16 text-wine mx-auto mb-4" />
          <h1 className="text-4xl font-serif text-wine mb-2">Wine Tasting</h1>
          <p className="text-gray-600">Join the tasting session with friends</p>
        </div>

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

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>7 wines • 4 rounds • 2 minutes per round</p>
        </div>
      </div>
    </div>
  );
};

export default Index;