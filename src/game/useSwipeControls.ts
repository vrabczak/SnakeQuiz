import type React from 'react';
import { useCallback, useRef } from 'react';
import { Direction, Point } from '../types';

/** Track pointer drags and convert them to directional changes. */
export function useSwipeControls(handleDirectionChange: (direction: Direction) => void) {
  const touchStart = useRef<Point | null>(null);
  const hasTurned = useRef(false);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    touchStart.current = { x: event.clientX, y: event.clientY };
    hasTurned.current = false;
  }, []);

  const resetGesture = useCallback((_: React.PointerEvent<HTMLCanvasElement>) => {
    touchStart.current = null;
    hasTurned.current = false;
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!touchStart.current || hasTurned.current) return;
      const dx = event.clientX - touchStart.current.x;
      const dy = event.clientY - touchStart.current.y;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        handleDirectionChange(dx > 0 ? 'right' : 'left');
      } else {
        handleDirectionChange(dy > 0 ? 'down' : 'up');
      }
      hasTurned.current = true;
    },
    [handleDirectionChange]
  );

  return { handlePointerDown, handlePointerMove, resetGesture };
}
