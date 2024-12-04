import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal } from "lucide-react";
import type { Player, Round } from '@/types/game';

type PlayerScore = {
  player: Player;
  correctCountries: number;
  correctSelectors: number;
  totalScore: number;
};

type ScoresScreenProps = {
  players: Player[];
  rounds: Round[];
  playerGuesses: Record<string, { country: string; selector: string; }>;
};

export const ScoresScreen = ({ players, rounds, playerGuesses }: ScoresScreenProps) => {
  const calculateScores = (): PlayerScore[] => {
    return players.map(player => {
      let correctCountries = 0;
      let correctSelectors = 0;

      rounds.forEach(round => {
        const guess = playerGuesses[`${player.id}-${round.id}`];
        if (guess) {
          if (guess.country === round.correct_country) correctCountries++;
          if (guess.selector === round.wine_selector) correctSelectors++;
        }
      });

      return {
        player,
        correctCountries,
        correctSelectors,
        totalScore: correctCountries + correctSelectors
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  };

  const scores = calculateScores();
  const winner = scores[0];

  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-4xl mx-auto pt-10">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-gold mx-auto mb-4" />
            <h1 className="text-3xl font-serif text-wine mb-2">Game Over!</h1>
            {winner && (
              <div className="bg-gold/10 p-4 rounded-lg inline-block">
                <p className="text-xl">
                  🎉 Winner: <span className="font-bold">{winner.player.player_name}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  with {winner.totalScore} points
                </p>
              </div>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Total Score</TableHead>
                <TableHead className="text-right">Correct Countries</TableHead>
                <TableHead className="text-right">Correct Selectors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scores.map((score, index) => (
                <TableRow key={score.player.id}>
                  <TableCell className="font-medium">
                    {index === 0 ? (
                      <Medal className="w-5 h-5 text-gold" />
                    ) : (
                      `#${index + 1}`
                    )}
                  </TableCell>
                  <TableCell>{score.player.player_name}</TableCell>
                  <TableCell className="text-right font-bold">{score.totalScore}</TableCell>
                  <TableCell className="text-right">{score.correctCountries}</TableCell>
                  <TableCell className="text-right">{score.correctSelectors}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};