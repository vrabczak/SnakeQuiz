import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { QuizTopic } from '../../../types';

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

  handleTopicChange(event: Event) {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.topicChange.emit(value);
  }

  handleSpeedChange(event: Event) {
    const value = (event.target as HTMLSelectElement | null)?.value;
    const parsed = value ? Number(value) : this.speed;
    this.speedChange.emit(parsed);
  }

  get primaryLabel() {
    return this.running ? 'Reset' : 'Start';
  }

  get primaryAction() {
    return this.running ? this.reset : this.start;
  }

  get showToggle() {
    return this.isMobile && this.collapsed;
  }

  get headerInteractive() {
    return this.isMobile && !this.collapsed;
  }

  onHeaderKeyDown(event: KeyboardEvent) {
    if (!this.headerInteractive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleCollapse.emit();
    }
  }
}
