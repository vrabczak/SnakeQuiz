import { TestBed } from '@angular/core/testing';
import { StatusBarComponent } from './status-bar.component';

describe('StatusBarComponent', () => {
  beforeEach(async () => {
    // Standalone component: register it directly for testing.
    await TestBed.configureTestingModule({
      imports: [StatusBarComponent]
    }).compileComponents();
  });

  it('creates the status bar', () => {
    const fixture = TestBed.createComponent(StatusBarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the countdown prompt when active', () => {
    const fixture = TestBed.createComponent(StatusBarComponent);
    const component = fixture.componentInstance;
    // Countdown prompt takes precedence during countdown phase.
    component.phase = 'countdown';
    component.countdown = 3;
    expect(component.prompt).toBe('Starting in 3...');
  });

  it('shows the question when playing', () => {
    const fixture = TestBed.createComponent(StatusBarComponent);
    const component = fixture.componentInstance;
    // Question prompt shows during gameplay.
    component.phase = 'playing';
    component.question = { prompt: '2 x 3', correct: 6, options: [6, 8, 9] };
    expect(component.prompt).toBe('2 x 3');
  });
});
