import { Point } from '../types';
import {
  BOARD_BACKGROUND,
  BOARD_DARK,
  BOARD_LIGHT,
  CELL_SIZE,
  GRID_HEIGHT,
  GRID_WIDTH,
  LABEL_SIZE
} from './config';
import { Label, Viewport } from './types';
import { clamp } from './utils';

/** Values required to render the current game state. */
interface RenderPayload {
  head: Point;
  snake: Point[];
  labels: Label[];
  visibleArea: { width: number; height: number };
}

/** Render the board background, walls, snake, and labels. */
export function renderGame(ctx: CanvasRenderingContext2D, { head, snake, labels, visibleArea }: RenderPayload) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = BOARD_BACKGROUND;
  ctx.fillRect(0, 0, width, height);

  const viewport = computeViewport(head, visibleArea.width, visibleArea.height);
  drawBackground(ctx, viewport);
  drawWalls(ctx, viewport);
  drawLabels(ctx, labels, viewport);
  drawSnake(ctx, snake, viewport);
}

function drawBackground(ctx: CanvasRenderingContext2D, viewport: Viewport) {
  const { cellSize, width, height, x, y } = viewport;
  for (let cy = 0; cy < height; cy += 1) {
    for (let cx = 0; cx < width; cx += 1) {
      const worldX = x + cx;
      const worldY = y + cy;
      const useDark = (worldX + worldY) % 2 === 0;
      ctx.fillStyle = useDark ? BOARD_DARK : BOARD_LIGHT;
      ctx.fillRect(cx * cellSize, cy * cellSize, cellSize, cellSize);
    }
  }
}

function drawWalls(ctx: CanvasRenderingContext2D, viewport: Viewport) {
  const { cellSize, width, height } = viewport;
  const thickness = Math.min(cellSize, Math.floor(cellSize * 0.85));

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255,255,255,0.35)';
  ctx.shadowBlur = Math.floor(thickness / 2);

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
  const outline = Math.max(1, Math.floor(cellSize * 0.1));
  snake.forEach((segment, index) => {
    const sx = (segment.x - x) * cellSize;
    const sy = (segment.y - y) * cellSize;
    ctx.fillStyle = index === 0 ? '#0ecb81' : '#1f9b76';
    ctx.fillRect(sx, sy, cellSize, cellSize);
    ctx.lineWidth = outline;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(sx + outline / 2, sy + outline / 2, cellSize - outline, cellSize - outline);
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

function computeViewport(head: Point, width: number, height: number): Viewport {
  const cellSize = CELL_SIZE;
  const x = clamp(head.x - Math.floor(width / 2), 0, GRID_WIDTH - width);
  const y = clamp(head.y - Math.floor(height / 2), 0, GRID_HEIGHT - height);
  return { x, y, width, height, cellSize };
}
