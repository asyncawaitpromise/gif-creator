import React, { useState, useRef, useEffect } from 'react';
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
  const [generatedGif, setGeneratedGif] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [frameDelay, setFrameDelay] = useState(500);

  const { handleResizeStart, resizeStartSize } = useResize(canvasSize);

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
    
    // Fix the fit modes reordering logic
    const newFitModes = {};
    const oldFitModes = { ...imageFitModes }; // Create a copy of current fit modes
    
    items.forEach((_, index) => {
      if (index === result.destination.index) {
        // Keep the original fit mode for the dragged item
        newFitModes[index] = oldFitModes[result.source.index];
      } else if (
        result.destination.index < result.source.index && // Moving item forward
        index >= result.destination.index &&
        index < result.source.index
      ) {
        // Shift items back
        newFitModes[index] = oldFitModes[index + 1];
      } else if (
        result.destination.index > result.source.index && // Moving item backward
        index > result.source.index &&
        index <= result.destination.index
      ) {
        // Shift items forward
        newFitModes[index] = oldFitModes[index - 1];
      } else {
        // Keep the same fit mode for unaffected items
        newFitModes[index] = oldFitModes[index];
      }
    });
    
    setImageFitModes(newFitModes);
    setSelectedFiles(items);
    
    // Update current image index if needed
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

  const generateGif = async () => {
    console.log('Starting GIF generation...');
    if (!canvasRef.current || selectedFiles.length === 0) {
      console.log('Early return - missing canvas or files');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      console.log('Creating offscreen canvas...');
      const offscreenCanvas = document.createElement('canvas');
      const offscreenCtx = offscreenCanvas.getContext('2d');
      offscreenCanvas.width = canvasSize.width;
      offscreenCanvas.height = canvasSize.height;
      console.log('Canvas created with dimensions:', canvasSize);

      console.log('Initializing encoder...');
      const encoder = new window.GIFEncoder(); // Use from window since it's loaded via script tag
      console.log('Encoder created:', encoder);
      
      console.log('Setting up encoder...');
      encoder.setRepeat(0); // 0 = loop forever
      encoder.setDelay(frameDelay); // Use the frameDelay state instead of hardcoded 500
      encoder.setSize(canvasSize.width, canvasSize.height);
      encoder.start();
      console.log('Encoder started');

      console.log('Processing images...');
      for (let i = 0; i < selectedFiles.length; i++) {
        console.log(`Processing image ${i + 1}/${selectedFiles.length}`);
        const file = selectedFiles[i];
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            console.log(`Image ${i + 1} loaded:`, img.width, 'x', img.height);
            offscreenCtx.clearRect(0, 0, canvasSize.width, canvasSize.height);
            
            const fitMode = imageFitModes[i] === 'contain' ? Math.min : Math.max;
            const scale = fitMode(
              canvasSize.width / img.width,
              canvasSize.height / img.height
            );
            
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const x = (canvasSize.width - scaledWidth) / 2;
            const y = (canvasSize.height - scaledHeight) / 2;
            
            console.log(`Drawing image ${i + 1} at:`, x, y, scaledWidth, scaledHeight);
            offscreenCtx.drawImage(img, x, y, scaledWidth, scaledHeight);
            encoder.addFrame(offscreenCtx);
            URL.revokeObjectURL(img.src);
            resolve();
          };
          img.onerror = (error) => {
            console.error(`Error loading image ${i + 1}:`, error);
            resolve();
          };
          img.src = URL.createObjectURL(file);
        });
        
        setGenerationProgress(Math.round((i + 1) / selectedFiles.length * 100));
      }

      console.log('Finishing encoder...');
      encoder.finish();
      console.log('Getting binary data...');
      const binary_gif = encoder.stream().getData();
      console.log('Creating data URL...');
      const data_url = 'data:image/gif;base64,' + window.encode64(binary_gif);
      console.log('GIF URL created:', data_url);
      
      setGeneratedGif(data_url);
    } catch (error) {
      console.error('Error in GIF generation:', error);
      console.error('Error stack:', error.stack);
    } finally {
      console.log('Generation process complete');
      setIsGenerating(false);
    }
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

            <div className="flex flex-col gap-4 p-4 border rounded-lg bg-base-200">
              <h3 className="text-lg font-semibold">GIF Options</h3>
              
              <div className="flex items-center gap-4">
                <label className="flex flex-col gap-2">
                  <span>Frame Duration (ms)</span>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={frameDelay}
                    onChange={(e) => setFrameDelay(Math.max(10, parseInt(e.target.value) || 0))}
                    className="input input-bordered w-32"
                  />
                </label>
                <div className="text-sm text-base-content/70">
                  Each frame will show for {frameDelay}ms ({(frameDelay / 1000).toFixed(2)} seconds)
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                className={`btn btn-primary ${isGenerating ? 'loading' : ''}`}
                onClick={generateGif}
                disabled={isGenerating}
              >
                {isGenerating ? `Generating GIF (${generationProgress}%)` : 'Generate GIF'}
              </button>

              {generatedGif && (
                <div className="flex flex-col items-center gap-4">
                  <h3 className="text-xl font-semibold">Generated GIF Preview</h3>
                  <img 
                    src={generatedGif} 
                    alt="Generated GIF" 
                    className="max-w-full border rounded-lg shadow-lg"
                  />
                  <a 
                    href={generatedGif} 
                    download="generated.gif"
                    className="btn btn-secondary"
                  >
                    Download GIF
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Creator;