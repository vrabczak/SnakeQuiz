import { GamePhase, QuizQuestion } from '../types';

interface StatusBarProps {
  question: QuizQuestion;
  score: number;
  phase: GamePhase;
  countdown: number | null;
}

export default function StatusBar({ question, score, phase, countdown }: StatusBarProps) {
  let prompt = '';

  if (phase === 'countdown' && countdown !== null) {
    prompt = `Starting in ${countdown}...`;
  } else if (phase === 'playing') {
    prompt = question.prompt;
  } else if (phase === 'over') {
    prompt = 'Game over · Press Start';
  }

  return (
    <section className="status-bar">
      <div className="question" aria-live="polite">
        <span className="label">Question</span>
        <strong>{prompt}</strong>
      </div>
      <div className="score" aria-live="polite">
        <span className="label">Score</span>
        <strong>{score}</strong>
      </div>
    </section>
  );
}
