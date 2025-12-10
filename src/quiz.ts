import { QuizQuestion, QuizTopic } from './types';

const OPTION_COUNT = 4;

export function generateQuestion(topic: QuizTopic, previous?: QuizQuestion): QuizQuestion {
  const minFactor = topic.minFactor;
  const maxFactor = topic.maxFactor;
  const fixedFactor = topic.fixedFactor;
  const minProduct = (fixedFactor ?? minFactor) * minFactor;
  const maxProduct = (fixedFactor ?? maxFactor) * maxFactor;

  let next: QuizQuestion;
  do {
    const variable = randomBetween(minFactor, maxFactor);
    let a = fixedFactor ?? randomBetween(minFactor, maxFactor);
    let b = variable;
    if (fixedFactor && Math.random() < 0.5) {
      a = variable;
      b = fixedFactor;
    }
    const correct = a * b;
    const options = new Set<number>();
    options.add(correct);
    while (options.size < OPTION_COUNT) {
      const offset = randomBetween(-5, 5);
      const candidate = correct + offset * randomBetween(1, 3);
      if (candidate >= minProduct && candidate <= maxProduct) {
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
