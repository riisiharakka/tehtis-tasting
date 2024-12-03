import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wine } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const [name, setName] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const { addPlayer } = useGame();
  const { toast } = useToast();

  const handleJoin = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to join the tasting.",
        variant: "destructive",
      });
      return;
    }

    const isAdmin = adminCode === '1234'; // Simple admin code for demo
    addPlayer(name, isAdmin);
    toast({
      title: "Welcome to the wine tasting!",
      description: `Joined as ${isAdmin ? 'host' : 'guest'}: ${name}`,
    });
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