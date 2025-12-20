import { Component, Input } from '@angular/core';
import type { GamePhase, QuizQuestion } from '../../../types';

@Component({
  standalone: true,
  selector: 'app-status-bar',
  template: `
    <section class="status-bar">
      <div class="question" aria-live="polite">
        <span class="label">Question</span>
        <strong>{{ prompt }}</strong>
      </div>
      <div class="score" aria-live="polite">
        <span class="label">Score</span>
        <strong>{{ score }}</strong>
      </div>
    </section>
  `
})
export class StatusBarComponent {
  @Input() question!: QuizQuestion;
  @Input() score = 0;
  @Input() phase: GamePhase = 'idle';
  @Input() countdown: number | null = null;

  get prompt() {
    if (this.phase === 'countdown' && this.countdown !== null) {
      return `Starting in ${this.countdown}...`;
    }
    if (this.phase === 'playing') {
      return this.question?.prompt ?? '';
    }
    if (this.phase === 'over') {
      return 'Game over · Press Start';
    }
    return '';
  }
}
