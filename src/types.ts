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
