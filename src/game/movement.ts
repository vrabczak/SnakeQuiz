import { Direction, Point } from '../types';
import { GRID_HEIGHT, GRID_WIDTH } from './config';

/** Map directions to unit vectors for movement. */
export const DIRECTION_MAP: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

/** Rotate a direction left or right relative to current heading. */
export function rotateDirection(current: Direction, turn: 'left' | 'right'): Direction {
  const order: Direction[] = ['up', 'right', 'down', 'left'];
  const step = turn === 'right' ? 1 : -1;
  const index = order.indexOf(current);
  const nextIndex = (index + step + order.length) % order.length;
  return order[nextIndex];
}

/** Center coordinate of the board. */
export function boardCenter(): Point {
  return { x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) };
}

/** Initial snake segments anchored at the board center. */
export function initialSnake(): Point[] {
  const center = boardCenter();
  return [center, { x: center.x - 1, y: center.y }, { x: center.x - 2, y: center.y }];
}
