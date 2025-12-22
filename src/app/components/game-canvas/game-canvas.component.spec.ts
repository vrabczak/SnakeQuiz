import { TestBed } from '@angular/core/testing';
import { GameCanvasComponent } from './game-canvas.component';

const question = { prompt: '2 x 3', correct: 6, options: [6, 8, 9] };

describe('GameCanvasComponent', () => {
  let originalResizeObserver: typeof ResizeObserver | undefined;
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame | undefined;
  let originalCancelAnimationFrame: typeof window.cancelAnimationFrame | undefined;

  beforeAll(() => {
    // ResizeObserver is missing in some test browsers; stub minimal behavior.
    originalResizeObserver = window.ResizeObserver;
    if (!window.ResizeObserver) {
      window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      } as unknown as typeof ResizeObserver;
    }
  });

  afterAll(() => {
    if (originalResizeObserver) {
      window.ResizeObserver = originalResizeObserver;
    }
  });

  beforeEach(async () => {
    // Avoid real animation loops during tests.
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;
    window.requestAnimationFrame = () => 0;
    window.cancelAnimationFrame = () => {};

    await TestBed.configureTestingModule({
      imports: [GameCanvasComponent]
    }).compileComponents();
  });

  afterEach(() => {
    if (originalRequestAnimationFrame) {
      window.requestAnimationFrame = originalRequestAnimationFrame;
    }
    if (originalCancelAnimationFrame) {
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    }
  });

  it('creates the game canvas', () => {
    const fixture = TestBed.createComponent(GameCanvasComponent);
    const component = fixture.componentInstance;
    // Provide a question so the component can start safely.
    component.question = question;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
