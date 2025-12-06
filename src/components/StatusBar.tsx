import { QuizQuestion } from '../types';

interface StatusBarProps {
  question: QuizQuestion;
  score: number;
}

export default function StatusBar({ question, score }: StatusBarProps) {
  return (
    <section className="status-bar">
      <div className="question" aria-live="polite">
        <span className="label">Question</span>
        <strong>{question.prompt}</strong>
      </div>
      <div className="score" aria-live="polite">
        <span className="label">Score</span>
        <strong>{score}</strong>
      </div>
    </section>
  );
}
