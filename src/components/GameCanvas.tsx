import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Direction, Point, QuizQuestion } from '../types';

interface GameCanvasProps {
  running: boolean;
  question: QuizQuestion;
  onCorrect: () => void;
  onWrong: () => void;
  onGameOver: () => void;
}

const GRID_WIDTH = 30;
const GRID_HEIGHT = 30;
const CELL_SIZE = 26;
const LABEL_SIZE = 2;
const STEP_MS = 170;

const DIRECTION_MAP: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

function rotateDirection(current: Direction, turn: 'left' | 'right'): Direction {
  const order: Direction[] = ['up', 'right', 'down', 'left'];
  const step = turn === 'right' ? 1 : -1;
  const index = order.indexOf(current);
  const nextIndex = (index + step + order.length) % order.length;
  return order[nextIndex];
}

interface Label {
  position: Point;
  value: number;
}

export default function GameCanvas({ running, question, onCorrect, onWrong, onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [snake, setSnake] = useState<Point[]>(() => initialSnake());
  const [direction, setDirection] = useState<Direction>('right');
  const [queuedDirection, setQueuedDirection] = useState<Direction>('right');
  const [labels, setLabels] = useState<Label[]>([]);
  const [camera, setCamera] = useState({ width: GRID_WIDTH, height: GRID_HEIGHT });
  const touchStart = useRef<Point | null>(null);
  const lastTick = useRef(performance.now());
  const snakeRef = useRef<Point[]>([]);
  const labelsRef = useRef<Label[]>([]);

  const visibleArea = useMemo(() => ({
    width: Math.min(camera.width, GRID_WIDTH),
    height: Math.min(camera.height, GRID_HEIGHT)
  }), [camera.height, camera.width]);

  const head = snake[0];

  const createLabels = useCallback(
    (currentSnake: Point[]) => {
      const BORDER_BUFFER = 2;
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
    setLabels(createLabels(snakeRef.current));
  }, [createLabels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const resize = () => {
      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      canvas.width = width;
      canvas.height = height;
      setCamera({ width: Math.floor(width / CELL_SIZE), height: Math.floor(height / CELL_SIZE) });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  const handleDirectionChange = useCallback(
    (next: Direction) => {
      const opposite: Record<Direction, Direction> = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left'
      };
      if (opposite[next] === direction) return;
      setQueuedDirection(next);
    },
    [direction]
  );

  const queueTurn = useCallback((turn: 'left' | 'right') => {
    setQueuedDirection((current) => rotateDirection(current, turn));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const turnMap: Record<string, 'left' | 'right'> = {
        ArrowLeft: 'left',
        ArrowRight: 'right'
      };
      const turn = turnMap[event.key];
      if (turn) {
        event.preventDefault();
        queueTurn(turn);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [queueTurn]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    touchStart.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!touchStart.current) return;
    const dx = event.clientX - touchStart.current.x;
    const dy = event.clientY - touchStart.current.y;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      handleDirectionChange(dx > 0 ? 'right' : 'left');
    } else {
      handleDirectionChange(dy > 0 ? 'down' : 'up');
    }
    touchStart.current = { x: event.clientX, y: event.clientY };
  };

  const step = useCallback(
    (timestamp: number) => {
      if (!running) return;
      if (timestamp - lastTick.current < STEP_MS) return;
      lastTick.current = timestamp;
      setDirection(queuedDirection);

      const movement = DIRECTION_MAP[queuedDirection];
      const currentSnake = snakeRef.current;
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

      if (labelIndex >= 0) {
        setLabels((current) => current.filter((_, index) => index !== labelIndex));
      }

      const updatedSnake = [newHead, ...currentSnake];
      if (!grow) {
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
    [onCorrect, onGameOver, onWrong, queuedDirection, question.correct, running]
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const render = () => {
      const { width, height } = canvas;
      ctx.fillStyle = '#0b1726';
      ctx.fillRect(0, 0, width, height);

      const viewport = computeViewport(head, visibleArea.width, visibleArea.height);
      drawWalls(ctx, viewport);
      drawLabels(ctx, labels, viewport);
      drawSnake(ctx, snake, viewport);
    };
    render();
  }, [head, labels, snake, visibleArea.height, visibleArea.width]);

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

function drawWalls(ctx: CanvasRenderingContext2D, viewport: Viewport) {
  const { cellSize, width, height } = viewport;
  const thickness = Math.min(cellSize, Math.floor(cellSize * 0.85));

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255,255,255,0.35)';
  ctx.shadowBlur = Math.floor(thickness / 2);

  // Only draw the segments of the border that are currently in view.
  if (viewport.y === 0) {
    ctx.fillRect(0, 0, width * cellSize, thickness);
  }
  if (viewport.y + height === GRID_HEIGHT) {
    ctx.fillRect(0, height * cellSize - thickness, width * cellSize, thickness);
  }
  if (viewport.x === 0) {
    ctx.fillRect(0, 0, thickness, height * cellSize);
  }
  if (viewport.x + width === GRID_WIDTH) {
    ctx.fillRect(width * cellSize - thickness, 0, thickness, height * cellSize);
  }
  ctx.restore();
}

function drawSnake(ctx: CanvasRenderingContext2D, snake: Point[], viewport: Viewport) {
  const { cellSize, x, y } = viewport;
  snake.forEach((segment, index) => {
    const sx = (segment.x - x) * cellSize;
    const sy = (segment.y - y) * cellSize;
    ctx.fillStyle = index === 0 ? '#0ecb81' : '#1f9b76';
    ctx.fillRect(sx, sy, cellSize, cellSize);
    if (index === 0) {
      ctx.fillStyle = '#0b1726';
      ctx.fillRect(sx + cellSize * 0.6, sy + cellSize * 0.3, cellSize * 0.12, cellSize * 0.12);
      ctx.fillRect(sx + cellSize * 0.6, sy + cellSize * 0.6, cellSize * 0.12, cellSize * 0.12);
    }
  });
}

function drawLabels(ctx: CanvasRenderingContext2D, labels: Label[], viewport: Viewport) {
  const { cellSize, x, y, width, height } = viewport;
  const labelPixelSize = cellSize * LABEL_SIZE;
  labels.forEach((label) => {
    const inView =
      label.position.x < x + width &&
      label.position.x + LABEL_SIZE > x &&
      label.position.y < y + height &&
      label.position.y + LABEL_SIZE > y;

    if (!inView) return;

    const lx = (label.position.x - x) * cellSize;
    const ly = (label.position.y - y) * cellSize;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.roundRect(lx + 4, ly + 4, labelPixelSize - 8, labelPixelSize - 8, Math.floor(labelPixelSize / 6));
    ctx.fill();
    ctx.fillStyle = '#16314f';
    ctx.font = `${Math.floor(cellSize * 0.8)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(label.value), lx + labelPixelSize / 2, ly + labelPixelSize / 2);
  });
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initialSnake(): Point[] {
  const center = { x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) };
  return [center, { x: center.x - 1, y: center.y }, { x: center.x - 2, y: center.y }];
}

interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  cellSize: number;
}

function computeViewport(head: Point, width: number, height: number): Viewport {
  const cellSize = CELL_SIZE;
  const x = clamp(head.x - Math.floor(width / 2), 0, GRID_WIDTH - width);
  const y = clamp(head.y - Math.floor(height / 2), 0, GRID_HEIGHT - height);
  return { x, y, width, height, cellSize };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
