import { useEffect, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import Menu from './components/Menu';
import StatusBar from './components/StatusBar';
import { GamePhase, QuizQuestion } from './types';
import { generateQuestion } from './quiz';

const QUIZ_TOPICS = ['Multiplication'];
const MOBILE_BREAKPOINT = 960;

/**
 * Root component that orchestrates game state, quiz logic, and responsive layout.
 * @returns JSX for the Snake Quiz shell with menu, status bar, and game canvas.
 */
export default function App() {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [topic, setTopic] = useState(QUIZ_TOPICS[0]);
  const [question, setQuestion] = useState<QuizQuestion>(() => generateQuestion());
  const [resetKey, setResetKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const isActive = phase === 'playing' || phase === 'countdown';
  const isPlaying = phase === 'playing';

  const onCorrect = () => {
    setScore((value) => value + 10);
    setQuestion(generateQuestion());
  };

  const onWrong = () => {
    setScore((value) => Math.max(0, value - 5));
  };

  const handleStart = () => {
    setQuestion(generateQuestion());
    setPhase('countdown');
    setCountdown(3);
    setResetKey((value) => value + 1);
  };

  const handleReset = () => {
    setScore(0);
    setQuestion(generateQuestion());
    setPhase('countdown');
    setCountdown(3);
    setResetKey((value) => value + 1);
    if (isMobile) {
      setMenuOpen(false);
    }
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
        topic={topic}
        topics={QUIZ_TOPICS}
        onStart={handleStart}
        onReset={handleReset}
        onTopicChange={setTopic}
        isMobile={isMobile}
        collapsed={isMenuCollapsed}
        onToggleCollapse={toggleMenu}
      />
      <main className="game-shell">
        <StatusBar question={question} score={score} phase={phase} countdown={countdown} />
        <GameCanvas
          key={resetKey}
          phase={phase}
          question={question}
          onCorrect={onCorrect}
          onWrong={onWrong}
          onGameOver={handleGameOver}
        />
      </main>
    </div>
  );
}
