import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Check, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
      <div className="max-w-4xl mx-auto pt-10 space-y-8">
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

          <div className="mb-8">
            <h2 className="text-xl font-serif text-wine mb-4">Final Scores</h2>
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

          <div>
            <h2 className="text-xl font-serif text-wine mb-4">Round by Round Comparison</h2>
            <Accordion type="single" collapsible className="space-y-4">
              {players.map(player => (
                <AccordionItem 
                  key={player.id} 
                  value={player.id}
                  className="bg-cream/50 px-4 rounded-lg border-none"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <h3 className="font-bold">{player.player_name}'s Answers</h3>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Round</TableHead>
                          <TableHead>Correct Country</TableHead>
                          <TableHead>Your Guess</TableHead>
                          <TableHead>Correct Selector</TableHead>
                          <TableHead>Your Guess</TableHead>
                          <TableHead className="text-right">Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rounds.map(round => {
                          const guess = playerGuesses[`${player.id}-${round.id}`];
                          const countryCorrect = guess?.country === round.correct_country;
                          const selectorCorrect = guess?.selector === round.wine_selector;
                          const roundPoints = (countryCorrect ? 1 : 0) + (selectorCorrect ? 1 : 0);

                          return (
                            <TableRow key={round.id}>
                              <TableCell>{round.round_number}</TableCell>
                              <TableCell className="flex items-center gap-2">
                                {round.correct_country}
                                {countryCorrect ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <X className="w-4 h-4 text-red-500" />
                                )}
                              </TableCell>
                              <TableCell>{guess?.country || '-'}</TableCell>
                              <TableCell className="flex items-center gap-2">
                                {round.wine_selector}
                                {selectorCorrect ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <X className="w-4 h-4 text-red-500" />
                                )}
                              </TableCell>
                              <TableCell>{guess?.selector || '-'}</TableCell>
                              <TableCell className="text-right font-bold">{roundPoints}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
};