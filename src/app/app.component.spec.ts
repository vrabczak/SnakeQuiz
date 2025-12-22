import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    // Standalone component: register it directly for testing.
    await TestBed.configureTestingModule({
      imports: [AppComponent]
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('does not allow score to go negative', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    // Guard against negative scores on wrong answers.
    component.score = 0;
    component.handleWrong();
    expect(component.score).toBe(0);
  });

  it('closes the menu on mobile when starting', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    // Simulate a mobile layout and starting a run.
    component.isMobile = true;
    component.menuOpen = true;
    component.startGame();
    expect(component.phase).toBe('playing');
    expect(component.menuOpen).toBe(false);
  });
});
