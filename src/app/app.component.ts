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
const BASE_POINTS = 10;
const SPEED_BONUS_STEP = 2;
const SPEED_STEP_MS = 50;
const NORMAL_SPEED_MS = 250;

/**
 * Root component that coordinates quiz state, scoring, and UI layout.
 */
@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, MenuComponent, StatusBarComponent, GameCanvasComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
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

  /**
   * Whether the game is actively running or counting down.
   */
  get isActive() {
    return this.phase === 'playing' || this.phase === 'countdown';
  }

  /**
   * Resolve the currently selected quiz topic.
   */
  get activeTopic(): QuizTopic {
    return this.quizTopics.find((item) => item.id === this.topicId) ?? this.quizTopics[0];
  }

  /**
   * Initialize mobile detection and resize listener.
   */
  ngOnInit() {
    this.updateIsMobile();
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * Tear down listeners and timers.
   */
  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
    this.clearCountdownTimer();
  }

  /**
   * Start a fresh run with a new question.
   */
  startGame() {
    this.runId += 1;
    this.question = generateQuestion(this.activeTopic, this.question);
    this.phase = 'playing';
    this.countdown = null;
    this.clearCountdownTimer();
    this.syncMenuState();
  }

  /**
   * Reset score and restart with a new question.
   */
  resetGame() {
    this.score = 0;
    this.runId += 1;
    this.question = generateQuestion(this.activeTopic, this.question);
    this.phase = 'playing';
    this.countdown = null;
    this.clearCountdownTimer();
    this.syncMenuState();
  }

  /**
   * Update the active topic and refresh the current question.
   */
  changeTopic(topicId: string) {
    this.topicId = topicId;
    this.question = generateQuestion(this.activeTopic, this.question);
  }

  /**
   * Update the game speed.
   */
  changeSpeed(value: number) {
    this.speedMs = value;
  }

  /**
   * Toggle the menu on mobile devices.
   */
  toggleMenu() {
    if (!this.isMobile) return;
    this.menuOpen = !this.menuOpen;
  }

  /**
   * Apply scoring and load the next question after a correct answer.
   */
  handleCorrect() {
    this.score += this.pointsForSpeed(this.speedMs);
    this.question = generateQuestion(this.activeTopic, this.question);
  }

  /**
   * Apply scoring penalty after a wrong answer.
   */
  handleWrong() {
    this.score = Math.max(0, this.score - 5);
  }

  /**
   * End the game and surface the game-over state.
   */
  handleGameOver() {
    this.phase = 'over';
    this.countdown = null;
    this.menuOpen = true;
    alert('GAME OVER');
  }

  /**
   * Placeholder for future countdown functionality.
   */
  private scheduleCountdown() {
    // Countdown disabled; kept for future use.
  }

  /**
   * Stop any active countdown timer.
   */
  private clearCountdownTimer() {
    if (this.countdownTimer !== null) {
      window.clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  /**
   * Track viewport size and update menu behavior.
   */
  private updateIsMobile() {
    this.isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    this.syncMenuState();
  }

  /**
   * Sync menu state based on game phase and viewport.
   */
  private syncMenuState() {
    if (!this.isActive) {
      this.menuOpen = true;
      return;
    }
    if (this.isMobile) {
      this.menuOpen = false;
    }
  }

  /**
   * Compute points for a correct answer, rewarding faster speeds only.
   */
  private pointsForSpeed(speedMs: number) {
    const stepsFaster = Math.max(0, Math.round((NORMAL_SPEED_MS - speedMs) / SPEED_STEP_MS));
    return BASE_POINTS + stepsFaster * SPEED_BONUS_STEP;
  }
}
