import { useEffect, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import Menu from './components/Menu';
import StatusBar from './components/StatusBar';
import { GamePhase, QuizQuestion, QuizTopic } from './types';
import { generateQuestion } from './quiz';
import { STEP_MS } from './game/config';

const QUIZ_TOPICS: QuizTopic[] = [
  { id: 'mixed', label: 'Multiplication 2–9', minFactor: 2, maxFactor: 9 },
  ...Array.from({ length: 8 }, (_, index) => {
    const factor = index + 2;
    return {
      id: `table-${factor}`,
      label: `Multiplication of ${factor}`,
      minFactor: 2,
      maxFactor: 9,
      fixedFactor: factor
    };
  })
];
const SPEED_OPTIONS = [
  { label: 'Very slow', value: 350 },
  { label: 'Slow', value: 300 },
  { label: 'Normal', value: 250 },
  { label: 'Fast', value: 200 },
  { label: 'Very fast', value: 150 }
];
const MOBILE_BREAKPOINT = 960;

/**
 * Root component that orchestrates game state, quiz logic, and responsive layout.
 * @returns JSX for the Snake Quiz shell with menu, status bar, and game canvas.
 */
export default function App() {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [topicId, setTopicId] = useState(QUIZ_TOPICS[0].id);
  const [speedMs, setSpeedMs] = useState(SPEED_OPTIONS[1].value);
  const [question, setQuestion] = useState<QuizQuestion>(() => generateQuestion(QUIZ_TOPICS[0]));
  const [resetKey, setResetKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const isActive = phase === 'playing' || phase === 'countdown';
  const isPlaying = phase === 'playing';
  const activeTopic = QUIZ_TOPICS.find((item) => item.id === topicId) ?? QUIZ_TOPICS[0];

  const onCorrect = () => {
    setScore((value) => value + 10);
    setQuestion((previous) => generateQuestion(activeTopic, previous));
  };

  const onWrong = () => {
    setScore((value) => Math.max(0, value - 5));
  };

  const handleStart = () => {
    setQuestion((previous) => generateQuestion(activeTopic, previous));
    setPhase('countdown');
    setCountdown(3);
    setResetKey((value) => value + 1);
  };

  const handleReset = () => {
    setScore(0);
    setQuestion((previous) => generateQuestion(activeTopic, previous));
    setPhase('countdown');
    setCountdown(3);
    setResetKey((value) => value + 1);
    if (isMobile) {
      setMenuOpen(false);
    }
  };

  const handleTopicChange = (value: string) => {
    setTopicId(value);
    const nextTopic = QUIZ_TOPICS.find((item) => item.id === value) ?? QUIZ_TOPICS[0];
    setQuestion((previous) => generateQuestion(nextTopic, previous));
  };

  const handleGameOver = () => {
    setPhase('over');
    setCountdown(null);
    alert('GAME OVER');
  };

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  useEffect(() => {
    if (!isActive) {
      setMenuOpen(true);
      return;
    }
    if (isMobile) {
      setMenuOpen(false);
    }
  }, [isActive, isMobile]);

  useEffect(() => {
    if (phase !== 'countdown' || countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setPhase('playing');
      return;
    }
    const timer = window.setTimeout(() => {
      setCountdown((value) => (value ?? 1) - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [phase, countdown]);

  const toggleMenu = () => {
    if (!isMobile) return;
    setMenuOpen((value) => !value);
  };

  const isMenuCollapsed = isMobile && isActive && !menuOpen;

  return (
    <div className="app">
      <Menu
        running={isActive}
        topicId={topicId}
        topics={QUIZ_TOPICS}
        speed={speedMs}
        speeds={SPEED_OPTIONS}
        onStart={handleStart}
        onReset={handleReset}
        onTopicChange={handleTopicChange}
        onSpeedChange={setSpeedMs}
        isMobile={isMobile}
        collapsed={isMenuCollapsed}
        onToggleCollapse={toggleMenu}
      />
      <main className="game-shell">
        <StatusBar question={question} score={score} phase={phase} countdown={countdown} />
        <GameCanvas
          key={resetKey}
          phase={phase}
          stepMs={speedMs}
          question={question}
          onCorrect={onCorrect}
          onWrong={onWrong}
          onGameOver={handleGameOver}
        />
      </main>
    </div>
  );
}
