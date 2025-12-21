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
import { CELL_SIZE, GRID_HEIGHT, GRID_WIDTH } from '../../../game/config';
import { SnakeGameEngine } from '../../../game/engine';
import { renderGame } from '../../../game/rendering';
import type { Direction, GamePhase, Point, QuizQuestion } from '../../../types';

@Component({
  standalone: true,
  selector: 'app-game-canvas',
  templateUrl: './game-canvas.component.html',
  styleUrls: ['./game-canvas.component.css']
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

  visibleArea = { width: GRID_WIDTH, height: GRID_HEIGHT };

  private engine = new SnakeGameEngine();
  private animationId: number | null = null;
  private resizeObserver?: ResizeObserver;
  private resizeRafId: number | null = null;
  private lastCanvasSize = { width: 0, height: 0 };
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

    if (changes['question'] && this.phase === 'playing' && this.engine.snake.length > 0) {
      this.engine.syncQuestion(this.question);
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
    if (this.resizeRafId !== null) {
      cancelAnimationFrame(this.resizeRafId);
      this.resizeRafId = null;
    }
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
    this.resizeObserver = new ResizeObserver(() => this.scheduleViewportUpdate());
    this.resizeObserver.observe(wrapper);
  }

  private scheduleViewportUpdate() {
    if (this.resizeRafId !== null) {
      cancelAnimationFrame(this.resizeRafId);
    }
    this.resizeRafId = requestAnimationFrame(() => {
      this.resizeRafId = null;
      this.updateViewport();
    });
  }

  private updateViewport() {
    const canvas = this.canvasRef?.nativeElement;
    const wrapper = this.wrapperRef?.nativeElement;
    if (!canvas || !wrapper) return;
    const width = wrapper.clientWidth || GRID_WIDTH * CELL_SIZE;
    const height = wrapper.clientHeight || GRID_HEIGHT * CELL_SIZE;
    if (width === this.lastCanvasSize.width && height === this.lastCanvasSize.height) return;
    canvas.width = width;
    canvas.height = height;
    this.lastCanvasSize = { width, height };
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
    this.engine.reset();
    this.render();
  }

  private startGame() {
    this.engine.start(this.question);
    this.render();
  }

  private handleDirectionChange(next: Direction) {
    this.engine.setDirection(next);
  }

  private handleImmediateDirectionChange(next: Direction) {
    this.engine.setImmediateDirection(next);
  }

  private step(timestamp: number) {
    if (this.phase !== 'playing') return;
    const result = this.engine.step(timestamp, this.stepMs, this.question);
    if (!result) return;
    if (result.gameOver) {
      this.zone.run(() => this.gameOver.emit());
      return;
    }
    if (result.correct) {
      this.zone.run(() => this.correct.emit());
    } else if (result.wrong) {
      this.zone.run(() => this.wrong.emit());
    }
    if (result.moved) {
      this.render();
    }
  }

  private render() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderGame(ctx, {
      head: this.engine.head,
      snake: this.engine.snake,
      labels: this.engine.labels,
      visibleArea: this.visibleArea
    });
  }
}
