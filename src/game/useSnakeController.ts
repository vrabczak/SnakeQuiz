import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Direction, GamePhase, Point, QuizQuestion } from '../types';
import { GRID_HEIGHT, GRID_WIDTH, LABEL_SIZE, STEP_MS } from './config';
import { DIRECTION_MAP, initialSnake, rotateDirection } from './movement';
import { Label } from './types';
import { randomBetween } from './utils';

/** External event handlers and state needed to control the snake game loop. */
interface UseSnakeControllerProps {
  phase: GamePhase;
  question: QuizQuestion;
  onCorrect: () => void;
  onWrong: () => void;
  onGameOver: () => void;
}

const BORDER_BUFFER = 2;

/** Manage snake movement, growth/shrink, and label spawning. */
export function useSnakeController({ phase, question, onCorrect, onWrong, onGameOver }: UseSnakeControllerProps) {
  const [snake, setSnake] = useState<Point[]>([]);
  const [, setDirection] = useState<Direction>('right');
  const [labels, setLabels] = useState<Label[]>([]);
  const lastTick = useRef(performance.now());
  const snakeRef = useRef<Point[]>([]);
  const labelsRef = useRef<Label[]>([]);
  const directionRef = useRef<Direction>('right');
  const directionQueue = useRef<Direction[]>([]); // future turns to apply one-per-tick

  const head = useMemo(
    () => snake[0] ?? { x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) },
    [snake]
  );

  const createLabels = useCallback(
    (currentSnake: Point[]) => {
      const minX = BORDER_BUFFER;
      const maxX = GRID_WIDTH - BORDER_BUFFER - LABEL_SIZE;
      const minY = BORDER_BUFFER;
      const maxY = GRID_HEIGHT - BORDER_BUFFER - LABEL_SIZE;
      const taken = new Set(currentSnake.map((segment) => `${segment.x},${segment.y}`));

      const areaIsFree = (position: Point) => {
        for (let dx = 0; dx < LABEL_SIZE; dx += 1) {
          for (let dy = 0; dy < LABEL_SIZE; dy += 1) {
            if (taken.has(`${position.x + dx},${position.y + dy}`)) return false;
          }
        }
        return true;
      };

      const markArea = (position: Point) => {
        for (let dx = 0; dx < LABEL_SIZE; dx += 1) {
          for (let dy = 0; dy < LABEL_SIZE; dy += 1) {
            taken.add(`${position.x + dx},${position.y + dy}`);
          }
        }
      };

      const options: Label[] = [];
      question.options.forEach((value) => {
        let position: Point;
        do {
          position = {
            x: randomBetween(minX, maxX),
            y: randomBetween(minY, maxY)
          };
        } while (!areaIsFree(position));
        markArea(position);
        options.push({ position, value });
      });
      return options;
    },
    [question.options]
  );

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  useEffect(() => {
    labelsRef.current = labels;
  }, [labels]);

  useEffect(() => {
    if (phase === 'countdown' || phase === 'idle') {
      setSnake([]);
      setLabels([]);
      snakeRef.current = [];
      labelsRef.current = [];
      setDirection('right');
      directionRef.current = 'right';
      directionQueue.current = [];
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (snakeRef.current.length) return;
    const startingDirection: Direction = 'right';
    setDirection(startingDirection);
    directionRef.current = startingDirection;
    directionQueue.current = [];
    lastTick.current = performance.now();
    const newSnake = initialSnake();
    setSnake(newSnake);
    snakeRef.current = newSnake;
    const newLabels = createLabels(newSnake);
    setLabels(newLabels);
    labelsRef.current = newLabels;
  }, [phase, createLabels]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (!snakeRef.current.length) return;
    const newLabels = createLabels(snakeRef.current);
    setLabels(newLabels);
    labelsRef.current = newLabels;
  }, [phase, createLabels, question]);

  const getPlannedDirection = useCallback(() => {
    const queue = directionQueue.current;
    return queue.length ? queue[queue.length - 1] : directionRef.current;
  }, []);

  const enqueueDirection = useCallback((next: Direction) => {
    const opposite: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    };
    const plannedDirection = getPlannedDirection();
    if (opposite[next] === plannedDirection) return;
    directionQueue.current.push(next);
  }, [getPlannedDirection]);

  const handleDirectionChange = useCallback(
    (next: Direction) => {
      enqueueDirection(next);
    },
    [enqueueDirection]
  );

  const queueTurn = useCallback(
    (turn: 'left' | 'right') => {
      const plannedDirection = getPlannedDirection();
      const nextDirection = rotateDirection(plannedDirection, turn);
      enqueueDirection(nextDirection);
    },
    [enqueueDirection, getPlannedDirection]
  );

  const step = useCallback(
    (timestamp: number) => {
      if (phase !== 'playing') return;
      if (timestamp - lastTick.current < STEP_MS) return;
      lastTick.current = timestamp;
      const queued = directionQueue.current.shift();
      const nextDirection = queued ?? directionRef.current;
      directionRef.current = nextDirection;
      setDirection(nextDirection);

      const movement = DIRECTION_MAP[nextDirection];
      const currentSnake = snakeRef.current;
      if (currentSnake.length === 0) return;
      const newHead = { x: currentSnake[0].x + movement.x, y: currentSnake[0].y + movement.y };
      const hitsWall =
        newHead.x <= 0 || newHead.y <= 0 || newHead.x >= GRID_WIDTH - 1 || newHead.y >= GRID_HEIGHT - 1;
      const hitsBody = currentSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y);
      if (hitsWall || hitsBody) {
        onGameOver();
        return;
      }

      const labelIndex = labelsRef.current.findIndex(
        (item) =>
          newHead.x >= item.position.x &&
          newHead.x < item.position.x + LABEL_SIZE &&
          newHead.y >= item.position.y &&
          newHead.y < item.position.y + LABEL_SIZE
      );
      const label = labelIndex >= 0 ? labelsRef.current[labelIndex] : undefined;
      const grow = label?.value === question.correct;
      const shrink = Boolean(label) && !grow;

      if (labelIndex >= 0) {
        setLabels((current) => current.filter((_, index) => index !== labelIndex));
      }

      const updatedSnake = [newHead, ...currentSnake];
      const targetLength = grow
        ? currentSnake.length + 1
        : shrink
          ? Math.max(3, currentSnake.length - 1)
          : currentSnake.length;
      while (updatedSnake.length > targetLength) {
        updatedSnake.pop();
      }
      setSnake(updatedSnake);
      snakeRef.current = updatedSnake;

      if (label) {
        if (grow) {
          onCorrect();
        } else {
          onWrong();
        }
      }
    },
    [onCorrect, onGameOver, onWrong, question.correct, phase]
  );

  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    let animationId: number;
    const loop = (timestamp: number) => {
      stepRef.current(timestamp);
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return { snake, labels, head, handleDirectionChange, queueTurn };
}
