import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface SessionCodeProps {
  code: string;
}

export const SessionCode = ({ code }: SessionCodeProps) => {
  const { toast } = useToast();

  const copySessionCode = async () => {
    await navigator.clipboard.writeText(code);
    toast({
      title: "Code copied!",
      description: "Share this code with your guests.",
    });
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h2 className="font-medium mb-2">Session Code</h2>
      <div className="flex items-center justify-between bg-white p-3 rounded border">
        <span className="font-mono text-lg">{code}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copySessionCode}
          className="text-wine hover:text-wine-light"
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        Share this code with your guests
      </p>
    </div>
  );
};