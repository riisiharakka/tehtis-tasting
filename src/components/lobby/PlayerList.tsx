import { Users } from 'lucide-react';

type Player = {
  id: string;
  player_name: string;
  is_host: boolean;
};

interface PlayerListProps {
  players: Player[];
}

export const PlayerList = ({ players }: PlayerListProps) => {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="font-medium mb-3">Players ({players.length})</h2>
      <ul className="space-y-2">
        {players.map((player) => (
          <li
            key={player.id}
            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
          >
            <span>{player.player_name}</span>
            {player.is_host && (
              <span className="text-xs bg-wine text-white px-2 py-1 rounded">
                Host
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};