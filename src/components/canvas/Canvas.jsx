import React, { useEffect } from 'react';
import ResizeHandles from './ResizeHandles';

const Canvas = ({ 
  canvasRef, 
  containerRef, 
  canvasSize, 
  handleResizeStart,
  selectedFiles 
}) => {
  return (
    <div 
      ref={containerRef}
      className="border border-base-300 rounded-lg p-4 overflow-auto max-h-full relative canvas-container"
    >
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
        style={{ background: '#f0f0f0' }}
      />
      
      <ResizeHandles 
        show={selectedFiles.length > 0}
        onResizeStart={handleResizeStart}
      />
    </div>
  );
};

export default Canvas; 