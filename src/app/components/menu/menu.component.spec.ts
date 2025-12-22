import { TestBed } from '@angular/core/testing';
import { MenuComponent } from './menu.component';

describe('MenuComponent', () => {
  beforeEach(async () => {
    // Standalone component: register it directly for testing.
    await TestBed.configureTestingModule({
      imports: [MenuComponent]
    }).compileComponents();
  });

  it('creates the menu', () => {
    const fixture = TestBed.createComponent(MenuComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes the correct primary label', () => {
    const fixture = TestBed.createComponent(MenuComponent);
    const component = fixture.componentInstance;
    // Label changes based on running state.
    component.running = false;
    expect(component.primaryLabel).toBe('Start');
    component.running = true;
    expect(component.primaryLabel).toBe('Reset');
  });
});
