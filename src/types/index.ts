export interface Player {
  id: string;
  name: string;
  stars: number;
  is_active: boolean;
  created_at?: string;
}

export interface Match {
  id: string;
  team_red_ids: string[];
  team_blue_ids: string[];
  score_red: number;
  score_blue: number;
  winner_color: "RED" | "BLUE" | "DRAW" | null;
  status: "IN_PROGRESS" | "FINISHED";
  duration_seconds: number;
}

export interface Team {
  name: string; // "Time 1", "Time 2"... e depois vira "Vermelho"/"Azul"
  players: Player[];
}

export interface MatchState {
  red: Team;
  blue: Team;
  queue: Team[]; // Time 3, Time 4...
  scoreRed: number;
  scoreBlue: number;
  timer: number;
  period: 1 | 2; // Opcional, se quiser 2 tempos
  isRunning: boolean;
}
