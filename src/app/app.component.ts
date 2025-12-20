import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import type { GamePhase, QuizQuestion, QuizTopic } from '../types';
import { generateQuestion } from '../quiz';
import { GameCanvasComponent } from './components/game-canvas/game-canvas.component';
import { MenuComponent } from './components/menu/menu.component';
import { StatusBarComponent } from './components/status-bar/status-bar.component';

const QUIZ_TOPICS: QuizTopic[] = [
  { id: 'mixed', label: 'Multiplication 2–9', minFactor: 2, maxFactor: 9 },
  ...Array.from({ length: 8 }, (_, index) => {
    const factor = index + 2;
    return {
      id: `table-${factor}`,
      label: `Multiplication of ${factor}`,
      minFactor: 2,
      maxFactor: 9,
      fixedFactor: factor
    };
  })
];

const SPEED_OPTIONS = [
  { label: 'Very slow', value: 350 },
  { label: 'Slow', value: 300 },
  { label: 'Normal', value: 250 },
  { label: 'Fast', value: 200 },
  { label: 'Very fast', value: 150 }
];

const MOBILE_BREAKPOINT = 960;

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, MenuComponent, StatusBarComponent, GameCanvasComponent],
  template: `
    <div class="app">
      <app-menu
        [running]="isActive"
        [topicId]="topicId"
        [topics]="quizTopics"
        [speed]="speedMs"
        [speeds]="speedOptions"
        [isMobile]="isMobile"
        [collapsed]="isMobile && isActive && !menuOpen"
        (start)="startGame()"
        (reset)="resetGame()"
        (topicChange)="changeTopic($event)"
        (speedChange)="changeSpeed($event)"
        (toggleCollapse)="toggleMenu()"
      ></app-menu>
      <main class="game-shell">
        <app-status-bar
          [question]="question"
          [score]="score"
          [phase]="phase"
          [countdown]="countdown"
        ></app-status-bar>
        <app-game-canvas
          [phase]="phase"
          [stepMs]="speedMs"
          [question]="question"
          [runId]="runId"
          (correct)="handleCorrect()"
          (wrong)="handleWrong()"
          (gameOver)="handleGameOver()"
        ></app-game-canvas>
      </main>
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  quizTopics = QUIZ_TOPICS;
  speedOptions = SPEED_OPTIONS;
  phase: GamePhase = 'idle';
  countdown: number | null = null;
  score = 0;
  topicId = this.quizTopics[0].id;
  speedMs = this.speedOptions[1].value;
  question: QuizQuestion = generateQuestion(this.quizTopics[0]);
  runId = 0;
  isMobile = false;
  menuOpen = true;

  private countdownTimer: number | null = null;
  private resizeHandler = () => this.updateIsMobile();

  get isActive() {
    return this.phase === 'playing' || this.phase === 'countdown';
  }

  get activeTopic(): QuizTopic {
    return this.quizTopics.find((item) => item.id === this.topicId) ?? this.quizTopics[0];
  }

  ngOnInit() {
    this.updateIsMobile();
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
    this.clearCountdownTimer();
  }

  startGame() {
    this.runId += 1;
    this.question = generateQuestion(this.activeTopic, this.question);
    this.phase = 'playing';
    this.countdown = null;
    this.clearCountdownTimer();
    this.syncMenuState();
  }

  resetGame() {
    this.score = 0;
    this.runId += 1;
    this.question = generateQuestion(this.activeTopic, this.question);
    this.phase = 'playing';
    this.countdown = null;
    this.clearCountdownTimer();
    this.syncMenuState();
  }

  changeTopic(topicId: string) {
    this.topicId = topicId;
    this.question = generateQuestion(this.activeTopic, this.question);
  }

  changeSpeed(value: number) {
    this.speedMs = value;
  }

  toggleMenu() {
    if (!this.isMobile) return;
    this.menuOpen = !this.menuOpen;
  }

  handleCorrect() {
    this.score += 10;
    this.question = generateQuestion(this.activeTopic, this.question);
  }

  handleWrong() {
    this.score = Math.max(0, this.score - 5);
  }

  handleGameOver() {
    this.phase = 'over';
    this.countdown = null;
    this.menuOpen = true;
    alert('GAME OVER');
  }

  private scheduleCountdown() {
    // Countdown disabled; kept for future use.
  }

  private clearCountdownTimer() {
    if (this.countdownTimer !== null) {
      window.clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private updateIsMobile() {
    this.isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    this.syncMenuState();
  }

  private syncMenuState() {
    if (!this.isActive) {
      this.menuOpen = true;
      return;
    }
    if (this.isMobile) {
      this.menuOpen = false;
    }
  }
}
