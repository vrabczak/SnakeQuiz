import { GamePhase, QuizQuestion } from '../types';

/**
 * Props displayed in the status bar above the playfield.
 */
interface StatusBarProps {
  question: QuizQuestion;
  score: number;
  phase: GamePhase;
  countdown: number | null;
}

/**
 * Shows the current quiz prompt or countdown along with the player's score.
 * @param props.question Current quiz data to present.
 * @param props.score Player's accumulated points.
 * @param props.phase Game lifecycle phase to decide messaging.
 * @param props.countdown Remaining seconds before play begins, if applicable.
 * @returns Status bar with question text and score values.
 */
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
