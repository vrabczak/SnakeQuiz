import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { QuizTopic } from '../../../types';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside [class]="collapsed ? 'menu collapsed' : 'menu'">
      <header
        [class]="headerInteractive ? 'menu-header interactive' : 'menu-header'"
        (click)="headerInteractive ? toggleCollapse.emit() : null"
        (keydown)="onHeaderKeyDown($event)"
        [attr.role]="headerInteractive ? 'button' : null"
        [attr.tabindex]="headerInteractive ? 0 : null"
        [attr.aria-expanded]="headerInteractive ? !collapsed : null"
      >
        <div>
          <h1>Snake Quiz</h1>
          <p class="subtitle">Grow by solving multiplication puzzles.</p>
        </div>
        <button
          *ngIf="showToggle"
          type="button"
          class="menu-toggle"
          (click)="toggleCollapse.emit()"
          [attr.aria-expanded]="!collapsed"
          [attr.aria-label]="collapsed ? 'Open menu' : 'Close menu'"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>
      <div class="menu-body" [hidden]="collapsed">
        <ul class="menu-list">
          <li>
            <button
              class="primary"
              type="button"
              (click)="primaryAction.emit()"
              [attr.aria-label]="running ? 'Reset game' : 'Start game'"
            >
              {{ primaryLabel }}
            </button>
          </li>
          <li>
            <label class="menu-label" for="topic-select">Quiz topic</label>
            <select
              id="topic-select"
              [value]="topicId"
              (change)="handleTopicChange($event)"
              aria-label="Select quiz topic"
            >
              <option *ngFor="let item of topics" [value]="item.id">
                {{ item.label }}
              </option>
            </select>
          </li>
          <li>
            <label class="menu-label" for="speed-select">Snake speed</label>
            <select
              id="speed-select"
              [value]="speed"
              (change)="handleSpeedChange($event)"
              aria-label="Select snake speed"
            >
              <option *ngFor="let option of speeds" [value]="option.value">
                {{ option.label }}
              </option>
            </select>
          </li>
        </ul>
        <footer class="menu-footer">
          <small>Optimized for tablets · Playable offline (PWA)</small>
        </footer>
      </div>
    </aside>
  `
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
