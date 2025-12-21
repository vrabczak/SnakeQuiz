import { GRID_HEIGHT, GRID_WIDTH, LABEL_SIZE } from './config';
import { DIRECTION_MAP, boardCenter, initialSnake } from './movement';
import { Label } from './types';
import { randomBetween } from './utils';
import type { Direction, Point, QuizQuestion } from '../types';

export type GameStepResult = {
  moved: boolean;
  gameOver?: boolean;
  correct?: boolean;
  wrong?: boolean;
};

export class SnakeGameEngine {
  snake: Point[] = [];
  labels: Label[] = [];
  head: Point = boardCenter();

  private lastTick = performance.now();
  private direction: Direction = 'right';
  private directionQueue: Direction[] = [];

  reset() {
    this.snake = [];
    this.labels = [];
    this.head = boardCenter();
    this.direction = 'right';
    this.directionQueue = [];
    this.lastTick = performance.now();
  }

  start(question?: QuizQuestion) {
    this.direction = 'right';
    this.directionQueue = [];
    this.lastTick = performance.now();
    const newSnake = initialSnake();
    this.snake = newSnake;
    this.head = newSnake[0];
    this.labels = this.createLabels(question, newSnake);
  }

  syncQuestion(question?: QuizQuestion) {
    if (this.snake.length === 0) return;
    this.labels = this.createLabels(question, this.snake);
  }

  step(timestamp: number, stepMs: number, question?: QuizQuestion): GameStepResult | null {
    if (timestamp - this.lastTick < stepMs) return null;
    this.lastTick = timestamp;
    const queued = this.directionQueue.shift();
    const nextDirection = queued ?? this.direction;
    this.direction = nextDirection;

    const movement = DIRECTION_MAP[nextDirection];
    if (this.snake.length === 0) return { moved: false };
    const newHead = { x: this.snake[0].x + movement.x, y: this.snake[0].y + movement.y };
    const hitsWall =
      newHead.x <= 0 || newHead.y <= 0 || newHead.x >= GRID_WIDTH - 1 || newHead.y >= GRID_HEIGHT - 1;
    const hitsBody = this.snake.some((segment) => segment.x === newHead.x && segment.y === newHead.y);
    if (hitsWall || hitsBody) {
      return { moved: false, gameOver: true };
    }

    const labelIndex = this.labels.findIndex(
      (item) =>
        newHead.x >= item.position.x &&
        newHead.x < item.position.x + LABEL_SIZE &&
        newHead.y >= item.position.y &&
        newHead.y < item.position.y + LABEL_SIZE
    );
    const label = labelIndex >= 0 ? this.labels[labelIndex] : undefined;
    const grow = label?.value === question?.correct;
    const shrink = Boolean(label) && !grow;

    const nextLabels =
      labelIndex >= 0 ? this.labels.filter((_, index) => index !== labelIndex) : this.labels.slice();

    const updatedSnake = [newHead, ...this.snake];
    const targetLength = grow
      ? this.snake.length + 1
      : shrink
        ? Math.max(3, this.snake.length - 1)
        : this.snake.length;

    while (updatedSnake.length > targetLength) {
      updatedSnake.pop();
    }

    this.snake = updatedSnake;
    this.head = updatedSnake[0];
    this.labels = nextLabels;

    return {
      moved: true,
      correct: Boolean(label) && grow,
      wrong: Boolean(label) && shrink
    };
  }

  setDirection(next: Direction) {
    this.enqueueDirection(next);
  }

  setImmediateDirection(next: Direction) {
    const opposite: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    };
    if (opposite[next] === this.direction) return;
    this.directionQueue = [];
    this.direction = next;
  }

  private createLabels(question: QuizQuestion | undefined, currentSnake: Point[]): Label[] {
    const minX = 2;
    const maxX = GRID_WIDTH - 2 - LABEL_SIZE;
    const minY = 2;
    const maxY = GRID_HEIGHT - 2 - LABEL_SIZE;
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
    question?.options.forEach((value) => {
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
  }

  private getPlannedDirection() {
    if (this.directionQueue.length) {
      return this.directionQueue[this.directionQueue.length - 1];
    }
    return this.direction;
  }

  private enqueueDirection(next: Direction) {
    const opposite: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    };
    const plannedDirection = this.getPlannedDirection();
    if (opposite[next] === plannedDirection) return;
    if (this.directionQueue.length >= 2) {
      this.directionQueue.shift();
    }
    this.directionQueue.push(next);
  }
}
