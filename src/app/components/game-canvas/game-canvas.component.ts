import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CELL_SIZE, GRID_HEIGHT, GRID_WIDTH, LABEL_SIZE } from '../../../game/config';
import { DIRECTION_MAP, boardCenter, initialSnake } from '../../../game/movement';
import { renderGame } from '../../../game/rendering';
import { Label } from '../../../game/types';
import { randomBetween } from '../../../game/utils';
import type { Direction, GamePhase, Point, QuizQuestion } from '../../../types';

@Component({
  standalone: true,
  selector: 'app-game-canvas',
  template: `
    <div class="game-window" #wrapper>
      <canvas
        #canvas
        class="game-canvas"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="resetGesture()"
        (pointercancel)="resetGesture()"
        role="presentation"
      ></canvas>
    </div>
  `
})
export class GameCanvasComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() phase: GamePhase = 'idle';
  @Input() stepMs = 250;
  @Input() question!: QuizQuestion;
  @Input() runId = 0;
  @Output() correct = new EventEmitter<void>();
  @Output() wrong = new EventEmitter<void>();
  @Output() gameOver = new EventEmitter<void>();

  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('wrapper') wrapperRef?: ElementRef<HTMLDivElement>;

  snake: Point[] = [];
  labels: Label[] = [];
  head: Point = boardCenter();
  visibleArea = { width: GRID_WIDTH, height: GRID_HEIGHT };

  private lastTick = performance.now();
  private direction: Direction = 'right';
  private directionQueue: Direction[] = [];
  private animationId: number | null = null;
  private resizeObserver?: ResizeObserver;
  private touchStart: Point | null = null;
  private hasTurned = false;

  constructor(private zone: NgZone) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['phase']) {
      const currentPhase = changes['phase'].currentValue as GamePhase;
      if (currentPhase === 'playing') {
        // Always start fresh when entering play (handles reset from game over).
        this.resetGameState();
        this.startGame();
      } else if (currentPhase === 'idle' || currentPhase === 'countdown') {
        this.resetGameState();
      }
    }

    if (changes['runId'] && !changes['phase'] && this.phase === 'playing') {
      // Force a fresh start when the run id changes without a phase change.
      this.resetGameState();
      this.startGame();
    }

    if (changes['question'] && this.phase === 'playing' && this.snake.length > 0) {
      this.labels = this.createLabels(this.snake);
      this.render();
    }
  }

  ngAfterViewInit() {
    this.updateViewport();
    this.observeResize();
    this.startLoop();
  }

  ngOnDestroy() {
    this.stopLoop();
    this.resizeObserver?.disconnect();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    const directionMap: Record<string, Direction> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right'
    };
    const direction = directionMap[event.key];
    if (direction) {
      event.preventDefault();
      this.handleDirectionChange(direction);
    }
  }

  onPointerDown(event: PointerEvent) {
    this.touchStart = { x: event.clientX, y: event.clientY };
    this.hasTurned = false;
  }

  onPointerMove(event: PointerEvent) {
    if (!this.touchStart || this.hasTurned) return;
    const dx = event.clientX - this.touchStart.x;
    const dy = event.clientY - this.touchStart.y;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.handleImmediateDirectionChange(dx > 0 ? 'right' : 'left');
    } else {
      this.handleImmediateDirectionChange(dy > 0 ? 'down' : 'up');
    }
    this.hasTurned = true;
  }

  resetGesture() {
    this.touchStart = null;
    this.hasTurned = false;
  }

  private observeResize() {
    const wrapper = this.wrapperRef?.nativeElement;
    if (!wrapper) return;
    this.resizeObserver = new ResizeObserver(() => this.updateViewport());
    this.resizeObserver.observe(wrapper);
  }

  private updateViewport() {
    const canvas = this.canvasRef?.nativeElement;
    const wrapper = this.wrapperRef?.nativeElement;
    if (!canvas || !wrapper) return;
    const width = wrapper.clientWidth || GRID_WIDTH * CELL_SIZE;
    const height = wrapper.clientHeight || GRID_HEIGHT * CELL_SIZE;
    canvas.width = width;
    canvas.height = height;
    this.visibleArea = {
      width: Math.min(Math.floor(width / CELL_SIZE), GRID_WIDTH),
      height: Math.min(Math.floor(height / CELL_SIZE), GRID_HEIGHT)
    };
    this.render();
  }

  private startLoop() {
    this.zone.runOutsideAngular(() => {
      const loop = (timestamp: number) => {
        this.step(timestamp);
        this.animationId = requestAnimationFrame(loop);
      };
      this.animationId = requestAnimationFrame(loop);
    });
  }

  private stopLoop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private resetGameState() {
    this.snake = [];
    this.labels = [];
    this.head = boardCenter();
    this.direction = 'right';
    this.directionQueue = [];
    this.lastTick = performance.now();
    this.render();
  }

  private startGame() {
    this.direction = 'right';
    this.directionQueue = [];
    this.lastTick = performance.now();
    const newSnake = initialSnake();
    this.snake = newSnake;
    this.head = newSnake[0];
    this.labels = this.createLabels(newSnake);
    this.render();
  }

  private createLabels(currentSnake: Point[]): Label[] {
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
    this.question?.options.forEach((value) => {
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

  private handleDirectionChange(next: Direction) {
    this.enqueueDirection(next);
  }

  private handleImmediateDirectionChange(next: Direction) {
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

  private step(timestamp: number) {
    if (this.phase !== 'playing') return;
    if (timestamp - this.lastTick < this.stepMs) return;
    this.lastTick = timestamp;
    const queued = this.directionQueue.shift();
    const nextDirection = queued ?? this.direction;
    this.direction = nextDirection;

    const movement = DIRECTION_MAP[nextDirection];
    if (this.snake.length === 0) return;
    const newHead = { x: this.snake[0].x + movement.x, y: this.snake[0].y + movement.y };
    const hitsWall =
      newHead.x <= 0 || newHead.y <= 0 || newHead.x >= GRID_WIDTH - 1 || newHead.y >= GRID_HEIGHT - 1;
    const hitsBody = this.snake.some((segment) => segment.x === newHead.x && segment.y === newHead.y);
    if (hitsWall || hitsBody) {
      this.zone.run(() => this.gameOver.emit());
      return;
    }

    const labelIndex = this.labels.findIndex(
      (item) =>
        newHead.x >= item.position.x &&
        newHead.x < item.position.x + LABEL_SIZE &&
        newHead.y >= item.position.y &&
        newHead.y < item.position.y + LABEL_SIZE
    );
    const label = labelIndex >= 0 ? this.labels[labelIndex] : undefined;
    const grow = label?.value === this.question?.correct;
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

    if (label) {
      if (grow) {
        this.zone.run(() => this.correct.emit());
      } else {
        this.zone.run(() => this.wrong.emit());
      }
    }

    this.render();
  }

  private render() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderGame(ctx, {
      head: this.head,
      snake: this.snake,
      labels: this.labels,
      visibleArea: this.visibleArea
    });
  }
}
