import type { AuthError, Session } from "@supabase/supabase-js";

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

export interface RankingItem {
  playerId: string;
  name: string;
  goals: number;
  assists: number;
  matches: number; // Futuro: Contar partidas jogadas
}

export interface MatchHistoryItem {
  id: string;
  date: string;
  time: string;
  scoreRed: number;
  scoreBlue: number;
  winner: "RED" | "BLUE" | "DRAW";
  teamRed: string[]; // IDs
  teamBlue: string[]; // IDs
}

export interface DraftColumnProps {
  title: string;
  color: "red" | "blue";
  players: Player[];
  onMove: (playerId: string) => void;
  onKick: (playerId: string) => void;
}

export interface ActiveTeamCardProps {
  color: "red" | "blue";
  team: Team;
  score: number;
  stats: Record<string, PlayerStats>;
  onGoal: () => void;
}

export interface EventHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string | null;
  onEventDeleted: (
    eventId: string,
    playerId: string,
    type: "GOAL" | "ASSIST"
  ) => void;
}

// Interface tipada para segurança
export interface MatchEventWithPlayer {
  id: string;
  player_id: string;
  event_type: "GOAL" | "ASSIST";
  created_at: string;
  players?: {
    name: string;
  };
}

export interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scorerId: string, assistId: string | null) => void;
  teamName: string;
  players: Player[]; // Jogadores do time que fez o gol
} // Interface tipada corretamente

export interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: AuthError | null }>; //
  signOut: () => Promise<void>;
}

// --- TIPOS LOCAIS ---
export type ViewState = "LOBBY" | "DRAFT" | "MATCH";
export type PlayerStats = { goals: number; assists: number; yellowCards?: number; redCards?: number };
export type GameOverReason = "GOAL_LIMIT" | "TIME_LIMIT" | "PENALTIES" | null;
export type Period = "TODAY" | "MONTH" | "YEAR" | "ALL";

export interface DraftState {
  red: Player[];
  blue: Player[];
  queue: Player[];
}
