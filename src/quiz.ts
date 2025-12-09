import { QuizQuestion } from './types';

const MIN_FACTOR = 2;
const MAX_FACTOR = 9;
const OPTION_COUNT = 4;
const MIN_PRODUCT = MIN_FACTOR * MIN_FACTOR;
const MAX_PRODUCT = MAX_FACTOR * MAX_FACTOR;

export function generateQuestion(previous?: QuizQuestion): QuizQuestion {
  let next: QuizQuestion;
  do {
    const a = randomBetween(MIN_FACTOR, MAX_FACTOR);
    const b = randomBetween(MIN_FACTOR, MAX_FACTOR);
    const correct = a * b;
    const options = new Set<number>();
    options.add(correct);
    while (options.size < OPTION_COUNT) {
      const offset = randomBetween(-5, 5);
      const candidate = correct + offset * randomBetween(1, 3);
      if (candidate >= MIN_PRODUCT && candidate <= MAX_PRODUCT) {
        options.add(candidate);
      }
    }
    next = {
      prompt: `${a} × ${b} = ?`,
      correct,
      options: shuffle([...options])
    };
  } while (previous && next.prompt === previous.prompt);
  return next;
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
