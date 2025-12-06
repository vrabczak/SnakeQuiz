import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Direction, Point, QuizQuestion } from '../types';

interface GameCanvasProps {
  running: boolean;
  question: QuizQuestion;
  onCorrect: () => void;
  onWrong: () => void;
  onGameOver: () => void;
}

const GRID_WIDTH = 60;
const GRID_HEIGHT = 40;
const CELL_SIZE = 26;
const STEP_MS = 170;

const DIRECTION_MAP: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

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

  const visibleArea = useMemo(() => ({
    width: Math.min(camera.width, GRID_WIDTH),
    height: Math.min(camera.height, GRID_HEIGHT)
  }), [camera.height, camera.width]);

  const head = snake[0];

  const placeLabels = useCallback(
    (currentSnake: Point[]) => {
      const taken = new Set(currentSnake.map((segment) => `${segment.x},${segment.y}`));
      const options: Label[] = [];
      question.options.forEach((value) => {
        let position: Point;
        do {
          position = {
            x: randomBetween(1, GRID_WIDTH - 2),
            y: randomBetween(1, GRID_HEIGHT - 2)
          };
        } while (taken.has(`${position.x},${position.y}`));
        taken.add(`${position.x},${position.y}`);
        options.push({ position, value });
      });
      setLabels(options);
    },
    [question.options]
  );

  useEffect(() => {
    placeLabels(snake);
  }, [placeLabels, snake, question.prompt]);

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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
      };
      const mapped = map[event.key];
      if (mapped) {
        event.preventDefault();
        handleDirectionChange(mapped);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleDirectionChange]);

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
      setSnake((current) => {
        const movement = DIRECTION_MAP[queuedDirection];
        const newHead = { x: current[0].x + movement.x, y: current[0].y + movement.y };
        const hitsWall =
          newHead.x <= 0 || newHead.y <= 0 || newHead.x >= GRID_WIDTH - 1 || newHead.y >= GRID_HEIGHT - 1;
        const hitsBody = current.some((segment) => segment.x === newHead.x && segment.y === newHead.y);
        if (hitsWall || hitsBody) {
          onGameOver();
          return current;
        }

        const label = labels.find((item) => item.position.x === newHead.x && item.position.y === newHead.y);
        const grow = label?.value === question.correct;
        if (label) {
          if (grow) {
            onCorrect();
          } else {
            onWrong();
          }
        }
        const nextSnake = [newHead, ...current];
        if (!grow) {
          nextSnake.pop();
        }
        placeLabels(nextSnake);
        return nextSnake;
      });
    },
    [labels, onCorrect, onGameOver, onWrong, placeLabels, question.correct, queuedDirection, running]
  );

  useEffect(() => {
    const loop = (timestamp: number) => {
      step(timestamp);
      requestAnimationFrame(loop);
    };
    const animation = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animation);
  }, [step]);

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
      drawGrid(ctx, viewport);
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
      {!running && <div className="overlay">Tap Start to play</div>}
    </div>
  );
}

function drawGrid(ctx: CanvasRenderingContext2D, viewport: Viewport) {
  const { cellSize, x, y, width, height } = viewport;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i <= width; i += 1) {
    const offset = (i - x) * cellSize;
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, height * cellSize);
    ctx.stroke();
  }
  for (let j = 0; j <= height; j += 1) {
    const offset = (j - y) * cellSize;
    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(width * cellSize, offset);
    ctx.stroke();
  }
}

function drawWalls(ctx: CanvasRenderingContext2D, viewport: Viewport) {
  const { cellSize, width, height } = viewport;
  ctx.fillStyle = '#16314f';
  ctx.fillRect(0, 0, width * cellSize, cellSize);
  ctx.fillRect(0, (height - 1) * cellSize, width * cellSize, cellSize);
  ctx.fillRect(0, 0, cellSize, height * cellSize);
  ctx.fillRect((width - 1) * cellSize, 0, cellSize, height * cellSize);
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
  const { cellSize, x, y } = viewport;
  labels.forEach((label) => {
    const lx = (label.position.x - x) * cellSize;
    const ly = (label.position.y - y) * cellSize;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.roundRect(lx + 4, ly + 4, cellSize - 8, cellSize - 8, 6);
    ctx.fill();
    ctx.fillStyle = '#16314f';
    ctx.font = `${Math.floor(cellSize * 0.4)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(label.value), lx + cellSize / 2, ly + cellSize / 2);
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
