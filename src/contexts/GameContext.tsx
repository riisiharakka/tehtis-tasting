import React, { createContext, useContext, useState } from 'react';

type Player = {
  id: string;
  name: string;
  isAdmin?: boolean;
};

type Round = {
  number: number;
  isActive: boolean;
  endTime?: Date;
  wines: number;
};

type GameContextType = {
  players: Player[];
  currentRound: Round | null;
  addPlayer: (name: string, isAdmin?: boolean) => void;
  startRound: (roundNumber: number) => void;
  endRound: () => void;
  currentPlayer?: Player;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player>();

  const addPlayer = (name: string, isAdmin = false) => {
    const newPlayer = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      isAdmin,
    };
    setPlayers([...players, newPlayer]);
    setCurrentPlayer(newPlayer);
  };

  const startRound = (roundNumber: number) => {
    const wineCount = roundNumber === 1 ? 1 : 2;
    setCurrentRound({
      number: roundNumber,
      isActive: true,
      endTime: new Date(Date.now() + 120000), // 2 minutes
      wines: wineCount,
    });
  };

  const endRound = () => {
    setCurrentRound(null);
  };

  return (
    <GameContext.Provider
      value={{
        players,
        currentRound,
        addPlayer,
        startRound,
        endRound,
        currentPlayer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}