import { useEffect, useRef, useState } from 'react';

/** Dimensions of the visible board slice in cells. */
interface VisibleArea {
  width: number;
  height: number;
}

/** Track canvas refs and compute visible cell dimensions on resize. */
export function useCanvasViewport(cellSize: number, gridWidth: number, gridHeight: number) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [visibleArea, setVisibleArea] = useState<VisibleArea>({ width: gridWidth, height: gridHeight });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const resize = () => {
      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      canvas.width = width;
      canvas.height = height;
      setVisibleArea({
        width: Math.min(Math.floor(width / cellSize), gridWidth),
        height: Math.min(Math.floor(height / cellSize), gridHeight)
      });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [cellSize, gridHeight, gridWidth]);

  return { canvasRef, wrapperRef, visibleArea };
}
