export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

export interface QuizQuestion {
  prompt: string;
  correct: number;
  options: number[];
}

export interface QuizTopic {
  id: string;
  label: string;
  minFactor: number;
  maxFactor: number;
  fixedFactor?: number;
}

export type GamePhase = 'idle' | 'countdown' | 'playing' | 'over';
