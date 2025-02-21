import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Custom debounce hook
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

const Creator = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [displaySize, setDisplaySize] = useState({ width: 800, height: 600 }); // For immediate UI feedback
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  const [resizeCorner, setResizeCorner] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [imageFitModes, setImageFitModes] = useState({});

  // Debounced setCanvasSize
  const debouncedSetCanvasSize = useDebounce((newSize) => {
    setCanvasSize(newSize);
  }, 150);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      const img = new Image();
      img.onload = () => {
        const newSize = {
          width: img.width,
          height: img.height
        };
        setCanvasSize(newSize);
        setDisplaySize(newSize);
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(imageFiles[0]);

      // Initialize fit modes to 'cover' by default
      const newFitModes = {};
      imageFiles.forEach((_, index) => {
        newFitModes[index] = 'cover'; // changed from 'contain' to 'cover'
      });
      setImageFitModes(newFitModes);
    }
    
    setSelectedFiles(imageFiles);
  };

  const drawImageToCanvas = (image) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reverse the logic: checked = contain, unchecked = cover
    const fitMode = imageFitModes[currentImageIndex] === 'contain' ? Math.min : Math.max;
    const scale = fitMode(
      canvas.width / image.width,
      canvas.height / image.height
    );
    
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;
    
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
  };

  useEffect(() => {
    if (selectedFiles.length > 0) {
      const image = new Image();
      image.onload = () => drawImageToCanvas(image);
      const currentFile = selectedFiles[currentImageIndex];
      image.src = URL.createObjectURL(currentFile);
      return () => URL.revokeObjectURL(image.src);
    }
  }, [selectedFiles, currentImageIndex, canvasSize, imageFitModes]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(selectedFiles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Reorder fit modes
    const newFitModes = {};
    items.forEach((_, index) => {
      if (index >= result.destination.index) {
        newFitModes[index] = imageFitModes[index - 1] || 'contain';
      } else if (index < result.source.index) {
        newFitModes[index] = imageFitModes[index] || 'contain';
      } else {
        newFitModes[index] = imageFitModes[result.source.index] || 'contain';
      }
    });
    
    setImageFitModes(newFitModes);
    setSelectedFiles(items);
    if (currentImageIndex === result.source.index) {
      setCurrentImageIndex(result.destination.index);
    } else if (
      currentImageIndex >= result.destination.index && 
      currentImageIndex < result.source.index
    ) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else if (
      currentImageIndex <= result.destination.index && 
      currentImageIndex > result.source.index
    ) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleSizeChange = (dimension, value) => {
    const newSize = {
      ...displaySize,
      [dimension]: parseInt(value) || 0
    };
    setDisplaySize(newSize); // Update display immediately
    debouncedSetCanvasSize(newSize); // Debounce the actual canvas update
  };

  const renderThumbnail = (file, index) => {
    const thumbnailUrl = URL.createObjectURL(file);
    return (
      <Draggable key={index} draggableId={`thumb-${index}`} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`
              relative cursor-pointer rounded-lg overflow-hidden
              hover:ring-2 hover:ring-primary transition-all
              ${currentImageIndex === index ? 'ring-2 ring-primary' : ''}
            `}
          >
            <div 
              onClick={() => setCurrentImageIndex(index)}
              className="w-24 h-24"
            >
              <img 
                src={thumbnailUrl}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onLoad={() => URL.revokeObjectURL(thumbnailUrl)}
              />
            </div>
            <label className="absolute top-1 right-1 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-xs"
                checked={imageFitModes[index] === 'contain'}
                onChange={(e) => {
                  e.stopPropagation();
                  setImageFitModes(prev => ({
                    ...prev,
                    [index]: e.target.checked ? 'contain' : 'cover'
                  }));
                }}
              />
            </label>
          </div>
        )}
      </Draggable>
    );
  };

  const handleResizeStart = (e, corner) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    setResizeStartPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setResizeStartSize({ ...canvasSize });
    setResizeCorner(corner);
    setIsResizing(true);
  };

  const handleResizeMove = (e) => {
    if (!isResizing || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
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

    const newSize = {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    };
    
    setDisplaySize(newSize); // Update display immediately
    debouncedSetCanvasSize(newSize); // Debounce the actual canvas update
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeCorner(null);
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStartPos, resizeStartSize, resizeCorner]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Creator</h1>
      
      <div className="flex flex-col gap-4">

        {/* Thumbnail Preview Area */}
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Selected Photos</h2>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="thumbnails" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-wrap gap-2 p-2 border border-base-300 rounded-lg overflow-x-auto min-h-[120px]"
                  >
                    {selectedFiles.map((file, index) => renderThumbnail(file, index))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
        
        {/* File Input */}
        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">Choose photos</span>
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input file-input-bordered w-full max-w-xs"
          />
        </div>

        {/* Canvas Size Controls */}
        {selectedFiles.length > 0 && (
          <div className="flex gap-6 items-end">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Canvas Width: {displaySize.width}px</span>
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                value={displaySize.width}
                onChange={(e) => handleSizeChange('width', e.target.value)}
                className="range range-primary"
                step="10"
              />
              <div className="w-full flex justify-between text-xs px-2 mt-1">
                <span>100px</span>
                <span>2000px</span>
              </div>
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Canvas Height: {displaySize.height}px</span>
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                value={displaySize.height}
                onChange={(e) => handleSizeChange('height', e.target.value)}
                className="range range-primary"
                step="10"
              />
              <div className="w-full flex justify-between text-xs px-2 mt-1">
                <span>100px</span>
                <span>2000px</span>
              </div>
            </div>
          </div>
        )}

        {/* Image Navigation */}
        {selectedFiles.length > 0 && (
          <div className="flex gap-2 items-center">
            <button
              className="btn btn-primary"
              onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
              disabled={currentImageIndex === 0}
            >
              Previous
            </button>
            <span className="text-sm">
              Image {currentImageIndex + 1} of {selectedFiles.length}
            </span>
            <button
              className="btn btn-primary"
              onClick={() => setCurrentImageIndex(prev => Math.min(selectedFiles.length - 1, prev + 1))}
              disabled={currentImageIndex === selectedFiles.length - 1}
            >
              Next
            </button>
          </div>
        )}

        {/* Canvas Display */}
        <div 
          ref={containerRef}
          className="border border-base-300 rounded-lg p-4 overflow-auto max-h-full relative"
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full"
            style={{ background: '#f0f0f0' }}
          />
          
          {/* Resize Handles */}
          {selectedFiles.length > 0 && (
            <>
              <div
                className="absolute w-3 h-3 bg-primary cursor-nw-resize hover:scale-125 transition-transform"
                style={{ top: '0.5rem', left: '0.5rem' }}
                onMouseDown={(e) => handleResizeStart(e, 'nw')}
              />
              <div
                className="absolute w-3 h-3 bg-primary cursor-ne-resize hover:scale-125 transition-transform"
                style={{ top: '0.5rem', right: '0.5rem' }}
                onMouseDown={(e) => handleResizeStart(e, 'ne')}
              />
              <div
                className="absolute w-3 h-3 bg-primary cursor-sw-resize hover:scale-125 transition-transform"
                style={{ bottom: '0.5rem', left: '0.5rem' }}
                onMouseDown={(e) => handleResizeStart(e, 'sw')}
              />
              <div
                className="absolute w-3 h-3 bg-primary cursor-se-resize hover:scale-125 transition-transform"
                style={{ bottom: '0.5rem', right: '0.5rem' }}
                onMouseDown={(e) => handleResizeStart(e, 'se')}
              />
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default Creator;