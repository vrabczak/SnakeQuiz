import { useEffect } from 'react';
import { Direction } from '../types';

/** Bind keyboard arrow keys to set absolute map directions. */
export function useKeyboardTurns(handleDirectionChange: (direction: Direction) => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.startsWith('Arrow')) {
        event.preventDefault();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const directionMap: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
      };
      const direction = directionMap[event.key];
      if (direction) {
        event.preventDefault();
        handleDirectionChange(direction);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleDirectionChange]);
}
