import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useDebounce } from '../hooks/useDebounce';
import { useResize } from '../hooks/useResize';
import Canvas from '../components/canvas/Canvas';
import CanvasSizeControls from '../components/controls/CanvasSizeControls';
import ImageNavigation from '../components/controls/ImageNavigation';
import ThumbnailList from '../components/thumbnails/ThumbnailList';
import FileInput from '../components/FileInput';

const Creator = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [displaySize, setDisplaySize] = useState({ width: 800, height: 600 });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [imageFitModes, setImageFitModes] = useState({});

  const { handleResizeStart, handleResizeMove, handleResizeEnd, resizeStartSize } = useResize(canvasSize);

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

  useEffect(() => {
    setDisplaySize(resizeStartSize);
    setCanvasSize(resizeStartSize);
  }, [resizeStartSize]);

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
    setCanvasSize(newSize); // Debounce the actual canvas update
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
                className="
                  checkbox checkbox-primary checkbox-xs 
                  [--chkfg:transparent] checked:rounded-none
                  "
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Creator</h1>
      
      <div className="flex flex-col gap-4">
        {selectedFiles.length > 0 && (
          <ThumbnailList
            files={selectedFiles}
            currentIndex={currentImageIndex}
            fitModes={imageFitModes}
            onDragEnd={handleDragEnd}
            onSelect={setCurrentImageIndex}
            onFitModeChange={(index, mode) => 
              setImageFitModes(prev => ({ ...prev, [index]: mode }))
            }
          />
        )}
        
        <FileInput onFileSelect={handleFileSelect} />

        {selectedFiles.length > 0 && (
          <>
            <CanvasSizeControls
              displaySize={displaySize}
              onSizeChange={handleSizeChange}
            />

            <ImageNavigation
              currentIndex={currentImageIndex}
              totalImages={selectedFiles.length}
              onPrevious={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
              onNext={() => setCurrentImageIndex(prev => 
                Math.min(selectedFiles.length - 1, prev + 1)
              )}
            />

            <Canvas
              canvasRef={canvasRef}
              containerRef={containerRef}
              canvasSize={canvasSize}
              handleResizeStart={handleResizeStart}
              selectedFiles={selectedFiles}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Creator;