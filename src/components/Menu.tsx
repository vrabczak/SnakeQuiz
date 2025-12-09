import type { KeyboardEvent } from 'react';

/**
 * Props controlling the game menu state and interactions.
 */
interface MenuProps {
  running: boolean;
  topic: string;
  topics: string[];
  onStart: () => void;
  onReset: () => void;
  onTopicChange: (topic: string) => void;
  isMobile: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Side menu that starts or resets the game and allows topic selection.
 * @param props.running Whether the game is currently active.
 * @param props.topic Current quiz topic value.
 * @param props.topics All available quiz topics.
 * @param props.onStart Handler to begin a new game.
 * @param props.onReset Handler to reset the existing game.
 * @param props.onTopicChange Handler to update the selected topic.
 * @param props.isMobile Whether the layout is in mobile mode.
 * @param props.collapsed Whether the menu is collapsed on mobile.
 * @param props.onToggleCollapse Handler to expand or collapse the menu on mobile.
 * @returns Collapsible control panel with primary actions and topic selector.
 */
export default function Menu({
  running,
  topic,
  topics,
  onStart,
  onReset,
  onTopicChange,
  isMobile,
  collapsed,
  onToggleCollapse
}: MenuProps) {
  const primaryLabel = running ? 'Reset' : 'Start';
  const primaryAction = running ? onReset : onStart;
  const showToggle = isMobile && collapsed;
  const headerIsInteractive = isMobile && !collapsed;

  const handleHeaderKeyDown = (event: KeyboardEvent) => {
    if (!headerIsInteractive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggleCollapse();
    }
  };

  return (
    <aside className={collapsed ? 'menu collapsed' : 'menu'}>
      <header
        className={headerIsInteractive ? 'menu-header interactive' : 'menu-header'}
        onClick={headerIsInteractive ? onToggleCollapse : undefined}
        onKeyDown={handleHeaderKeyDown}
        role={headerIsInteractive ? 'button' : undefined}
        tabIndex={headerIsInteractive ? 0 : undefined}
        aria-expanded={headerIsInteractive ? !collapsed : undefined}
      >
        <div>
          <h1>Snake Quiz</h1>
          <p className="subtitle">Grow by solving multiplication puzzles.</p>
        </div>
        {showToggle && (
          <button
            type="button"
            className="menu-toggle"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Open menu' : 'Close menu'}
          >
            <span />
            <span />
            <span />
          </button>
        )}
      </header>
      <div className="menu-body" hidden={collapsed}>
        <ul className="menu-list">
          <li>
            <button
              className="primary"
              onClick={primaryAction}
              aria-label={running ? 'Reset game' : 'Start game'}
            >
              {primaryLabel}
            </button>
          </li>
          <li>
            <label className="menu-label" htmlFor="topic-select">Quiz topic</label>
            <select
              id="topic-select"
              value={topic}
              onChange={(event) => onTopicChange(event.target.value)}
              aria-label="Select quiz topic"
            >
              {topics.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </li>
        </ul>
        <footer className="menu-footer">
          <small>Optimized for tablets · Playable offline (PWA)</small>
        </footer>
      </div>
    </aside>
  );
}
