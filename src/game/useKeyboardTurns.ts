import { useEffect } from 'react';

type Turn = 'left' | 'right';

/** Bind keyboard arrow keys to queue snake turns. */
export function useKeyboardTurns(queueTurn: (turn: Turn) => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const turnMap: Record<string, Turn> = {
        ArrowLeft: 'left',
        ArrowRight: 'right'
      };
      const turn = turnMap[event.key];
      if (turn) {
        event.preventDefault();
        queueTurn(turn);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [queueTurn]);
}
