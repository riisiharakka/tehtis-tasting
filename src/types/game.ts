export type Player = {
  id: string;
  player_name: string;
  is_host: boolean;
  hasSubmitted?: boolean;
};

export type Round = {
  id: string;
  session_id: string;
  round_number: number;
  wine_selector: string;
  correct_country: string;
  created_at: string;
};

export type PlayerGuess = {
  id: string;
  player_id: string;
  round_id: string;
  guessed_country: string;
  guessed_selector: string;
  created_at: string;
};