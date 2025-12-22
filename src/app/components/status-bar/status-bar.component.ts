import { Component, Input } from '@angular/core';
import type { GamePhase, QuizQuestion } from '../../../types';

/**
 * Status bar that displays the current prompt and game state.
 */
@Component({
  standalone: true,
  selector: 'app-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.css']
})
export class StatusBarComponent {
  @Input() question!: QuizQuestion;
  @Input() score = 0;
  @Input() phase: GamePhase = 'idle';
  @Input() countdown: number | null = null;

  /**
   * Resolve the message shown in the status bar.
   */
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
