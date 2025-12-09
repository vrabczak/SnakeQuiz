import { useEffect } from 'react';
import { GamePhase, QuizQuestion } from '../types';
import { CELL_SIZE, GRID_HEIGHT, GRID_WIDTH } from '../game/config';
import { renderGame } from '../game/rendering';
import { useCanvasViewport } from '../game/useCanvasViewport';
import { useKeyboardTurns } from '../game/useKeyboardTurns';
import { useSnakeController } from '../game/useSnakeController';
import { useSwipeControls } from '../game/useSwipeControls';

/**
 * Props for the game canvas that renders the snake and quiz labels.
 */
interface GameCanvasProps {
  phase: GamePhase;
  stepMs: number;
  question: QuizQuestion;
  onCorrect: () => void;
  onWrong: () => void;
  onGameOver: () => void;
}

/**
 * Canvas wrapper responsible for rendering the game and wiring input handlers.
 * @param props.phase Current lifecycle phase of the game.
 * @param props.stepMs Milliseconds per snake move tick.
 * @param props.question Active quiz prompt driving the board labels.
 * @param props.onCorrect Callback when the player eats the correct answer.
 * @param props.onWrong Callback when the player collides with an incorrect label.
 * @param props.onGameOver Callback when the snake dies.
 * @returns Game canvas with keyboard and touch controls bound.
 */
export default function GameCanvas({ phase, stepMs, question, onCorrect, onWrong, onGameOver }: GameCanvasProps) {
  const { canvasRef, wrapperRef, visibleArea } = useCanvasViewport(CELL_SIZE, GRID_WIDTH, GRID_HEIGHT);
  const { snake, labels, head, handleDirectionChange, handleImmediateDirectionChange, queueTurn } = useSnakeController({
    phase,
    stepMs,
    question,
    onCorrect,
    onWrong,
    onGameOver
  });
  useKeyboardTurns(queueTurn);
  const { handlePointerDown, handlePointerMove } = useSwipeControls(handleImmediateDirectionChange);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderGame(ctx, { head, snake, labels, visibleArea });
  }, [canvasRef, head, labels, snake, visibleArea]);

  return (
    <div className="game-window" ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        role="presentation"
      />
    </div>
  );
}
