interface MenuProps {
  running: boolean;
  topic: string;
  topics: string[];
  onStart: () => void;
  onReset: () => void;
  onTopicChange: (topic: string) => void;
}

export default function Menu({ running, topic, topics, onStart, onReset, onTopicChange }: MenuProps) {
  return (
    <aside className="menu">
      <header>
        <h1>Snake Quiz</h1>
        <p className="subtitle">Grow by solving multiplication puzzles.</p>
      </header>
      <ul className="menu-list">
        <li>
          <button className="primary" onClick={onStart} aria-label="Start or resume game">
            {running ? 'Resume' : 'Start'}
          </button>
        </li>
        <li>
          <button onClick={onReset} aria-label="Reset game">Reset</button>
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
    </aside>
  );
}
