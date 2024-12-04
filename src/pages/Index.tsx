import { Wine } from 'lucide-react';
import { JoinForm } from '@/components/join/JoinForm';

const Index = () => {
  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-md mx-auto pt-10 animate-fadeIn">
        <div className="text-center mb-8">
          <Wine className="w-16 h-16 text-wine mx-auto mb-4" />
          <h1 className="text-4xl font-serif text-wine mb-2">Wine Tasting</h1>
          <p className="text-gray-600">Join the wine tasting session at Tehtaankatu</p>
        </div>

        <JoinForm />

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Independence day shenanigans</p>
        </div>
      </div>
    </div>
  );
};

export default Index;