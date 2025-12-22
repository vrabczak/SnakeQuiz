import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { QuizTopic } from '../../../types';

/**
 * Menu for selecting topics, speed, and starting/resetting the game.
 */
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent {
  @Input() running = false;
  @Input() topicId = '';
  @Input() topics: QuizTopic[] = [];
  @Input() speed = 0;
  @Input() speeds: { label: string; value: number }[] = [];
  @Input() isMobile = false;
  @Input() collapsed = false;

  @Output() start = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() topicChange = new EventEmitter<string>();
  @Output() speedChange = new EventEmitter<number>();
  @Output() toggleCollapse = new EventEmitter<void>();

  /**
   * Emit the selected quiz topic.
   */
  handleTopicChange(event: Event) {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.topicChange.emit(value);
  }

  /**
   * Emit the selected speed option.
   */
  handleSpeedChange(event: Event) {
    const value = (event.target as HTMLSelectElement | null)?.value;
    const parsed = value ? Number(value) : this.speed;
    this.speedChange.emit(parsed);
  }

  /**
   * Label for the primary action button.
   */
  get primaryLabel() {
    return this.running ? 'Reset' : 'Start';
  }

  /**
   * Event emitter for the primary action.
   */
  get primaryAction() {
    return this.running ? this.reset : this.start;
  }

  /**
   * Whether to show the collapse toggle.
   */
  get showToggle() {
    return this.isMobile && this.collapsed;
  }

  /**
   * Whether the header should be keyboard-interactive.
   */
  get headerInteractive() {
    return this.isMobile && !this.collapsed;
  }

  /**
   * Handle Enter/Space on the header for menu toggling.
   */
  onHeaderKeyDown(event: KeyboardEvent) {
    if (!this.headerInteractive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleCollapse.emit();
    }
  }
}
