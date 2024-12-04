import { Users, Trophy } from 'lucide-react';
import { Player } from '@/types/game';

type PlayerListProps = {
  players: Player[];
};

export const PlayerList = ({ players }: PlayerListProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <Users className="w-12 h-12 text-wine mx-auto mb-2" />
        <h2 className="text-2xl font-serif text-wine">Players</h2>
        <p className="text-gray-600 mt-2">
          {players.length} participants
        </p>
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <ul className="space-y-2">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
              >
                <span>{player.player_name}</span>
                <div className="flex items-center gap-2">
                  {player.is_host && (
                    <span className="text-xs bg-wine text-white px-2 py-1 rounded">
                      Host
                    </span>
                  )}
                  {player.hasSubmitted && (
                    <Trophy className="w-4 h-4 text-gold" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};