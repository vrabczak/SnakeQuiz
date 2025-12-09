import { QuizQuestion } from '../types';

interface StatusBarProps {
  running: boolean;
  question: QuizQuestion;
  score: number;
}

export default function StatusBar({ running, question, score }: StatusBarProps) {
  const prompt = running ? question.prompt : '';

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
