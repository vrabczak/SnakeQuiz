import { useMemo, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import Menu from './components/Menu';
import StatusBar from './components/StatusBar';
import { QuizQuestion } from './types';
import { generateQuestion } from './quiz';

const QUIZ_TOPICS = ['Multiplication'];

export default function App() {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [topic, setTopic] = useState(QUIZ_TOPICS[0]);
  const [question, setQuestion] = useState<QuizQuestion>(() => generateQuestion());
  const [resetKey, setResetKey] = useState(0);

  const onCorrect = () => {
    setScore((value) => value + 10);
    setQuestion(generateQuestion());
  };

  const onWrong = () => {
    setScore((value) => Math.max(0, value - 5));
  };

  const handleStart = () => {
    setRunning(true);
    setResetKey((value) => value + 1);
  };

  const handleReset = () => {
    setScore(0);
    setQuestion(generateQuestion());
    setResetKey((value) => value + 1);
  };

  const menu = useMemo(
    () => ({
      running,
      topic,
      topics: QUIZ_TOPICS,
      onStart: handleStart,
      onReset: handleReset,
      onTopicChange: setTopic
    }),
    [running, topic]
  );

  return (
    <div className="app">
      <Menu {...menu} />
      <main className="game-shell">
        <StatusBar question={question} score={score} />
        <GameCanvas
          key={resetKey}
          running={running}
          question={question}
          onCorrect={onCorrect}
          onWrong={onWrong}
          onGameOver={() => setRunning(false)}
        />
      </main>
    </div>
  );
}
