import React from 'react';

const ResizeHandles = ({ show, onResizeStart }) => {
  if (!show) return null;

  return (
    <>
      <div
        className="absolute w-3 h-3 bg-primary cursor-nw-resize hover:scale-125 transition-transform"
        style={{ top: '0.5rem', left: '0.5rem' }}
        onMouseDown={(e) => onResizeStart(e, 'nw')}
      />
      <div
        className="absolute w-3 h-3 bg-primary cursor-ne-resize hover:scale-125 transition-transform"
        style={{ top: '0.5rem', right: '0.5rem' }}
        onMouseDown={(e) => onResizeStart(e, 'ne')}
      />
      <div
        className="absolute w-3 h-3 bg-primary cursor-sw-resize hover:scale-125 transition-transform"
        style={{ bottom: '0.5rem', left: '0.5rem' }}
        onMouseDown={(e) => onResizeStart(e, 'sw')}
      />
      <div
        className="absolute w-3 h-3 bg-primary cursor-se-resize hover:scale-125 transition-transform"
        style={{ bottom: '0.5rem', right: '0.5rem' }}
        onMouseDown={(e) => onResizeStart(e, 'se')}
      />
    </>
  );
};

export default ResizeHandles; 