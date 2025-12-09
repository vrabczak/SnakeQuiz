import { Point } from '../types';

/** Option label placed on the board. */
export interface Label {
  position: Point;
  value: number;
}

/** Viewport slice of the board in world coordinates. */
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  cellSize: number;
}
