import React, { useState, useRef, useEffect } from 'react';

const Creator = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const canvasRef = useRef(null);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setSelectedFiles(imageFiles);
  };

  useEffect(() => {
    if (selectedFiles.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const image = new Image();
      image.onload = () => {
        // Set canvas size to match image dimensions
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
      };
      
      const currentFile = selectedFiles[currentImageIndex];
      image.src = URL.createObjectURL(currentFile);

      return () => URL.revokeObjectURL(image.src);
    }
  }, [selectedFiles, currentImageIndex]);

  const renderThumbnail = (file, index) => {
    const thumbnailUrl = URL.createObjectURL(file);
    return (
      <div 
        key={index}
        onClick={() => setCurrentImageIndex(index)}
        className={`
          relative cursor-pointer rounded-lg overflow-hidden
          hover:ring-2 hover:ring-primary transition-all
          ${currentImageIndex === index ? 'ring-2 ring-primary' : ''}
        `}
      >
        <img 
          src={thumbnailUrl}
          alt={`Thumbnail ${index + 1}`}
          className="w-24 h-24 object-cover"
          onLoad={() => URL.revokeObjectURL(thumbnailUrl)}
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Creator</h1>
      
      <div className="flex flex-col gap-4">

        {/* Thumbnail Preview Area */}
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Selected Photos</h2>
            <div className="flex flex-wrap gap-2 p-2 border border-base-300 rounded-lg overflow-x-auto">
              {selectedFiles.map((file, index) => renderThumbnail(file, index))}
            </div>
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
        <div className="border border-base-300 rounded-lg p-4 overflow-auto max-h-full">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full"
          />
        </div>

      </div>
    </div>
  );
};

export default Creator;