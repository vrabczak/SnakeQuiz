import { QuizQuestion } from './types';

const MIN_FACTOR = 2;
const MAX_FACTOR = 12;
const OPTION_COUNT = 4;

export function generateQuestion(): QuizQuestion {
  const a = randomBetween(MIN_FACTOR, MAX_FACTOR);
  const b = randomBetween(MIN_FACTOR, MAX_FACTOR);
  const correct = a * b;
  const options = new Set<number>();
  options.add(correct);
  while (options.size < OPTION_COUNT) {
    const offset = randomBetween(-5, 5);
    const candidate = correct + offset * randomBetween(1, 3);
    if (candidate > 0) {
      options.add(candidate);
    }
  }
  return {
    prompt: `${a} × ${b} = ?`,
    correct,
    options: shuffle([...options])
  };
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
