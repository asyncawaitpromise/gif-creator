import { useState, useEffect, useCallback } from 'react';

export const useResize = (initialSize) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState(initialSize);
  const [resizeCorner, setResizeCorner] = useState(null);
  const [containerElement, setContainerElement] = useState(null);

  const handleResizeStart = useCallback((e, corner) => {
    e.preventDefault();
    const container = e.currentTarget.closest('.canvas-container');
    setContainerElement(container);
    const rect = container.getBoundingClientRect();
    setResizeStartPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setResizeStartSize(initialSize);
    setResizeCorner(corner);
    setIsResizing(true);
  }, [initialSize]);

  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !containerElement) return;

    const rect = containerElement.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const deltaX = currentX - resizeStartPos.x;
    const deltaY = currentY - resizeStartPos.y;

    let newWidth = resizeStartSize.width;
    let newHeight = resizeStartSize.height;

    switch (resizeCorner) {
      case 'se':
        newWidth = Math.max(100, resizeStartSize.width + deltaX);
        newHeight = Math.max(100, resizeStartSize.height + deltaY);
        break;
      case 'sw':
        newWidth = Math.max(100, resizeStartSize.width - deltaX);
        newHeight = Math.max(100, resizeStartSize.height + deltaY);
        break;
      case 'ne':
        newWidth = Math.max(100, resizeStartSize.width + deltaX);
        newHeight = Math.max(100, resizeStartSize.height - deltaY);
        break;
      case 'nw':
        newWidth = Math.max(100, resizeStartSize.width - deltaX);
        newHeight = Math.max(100, resizeStartSize.height - deltaY);
        break;
    }

    setResizeStartSize({
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    });
  }, [isResizing, resizeCorner, resizeStartPos, resizeStartSize, containerElement]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeCorner(null);
    setContainerElement(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return {
    isResizing,
    handleResizeStart,
    resizeStartSize
  };
}; 