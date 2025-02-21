import React from 'react';

const ImageNavigation = ({ 
  currentIndex, 
  totalImages, 
  onPrevious, 
  onNext 
}) => {
  return (
    <div className="flex gap-2 items-center">
      <button
        className="btn btn-primary"
        onClick={onPrevious}
        disabled={currentIndex === 0}
      >
        Previous
      </button>
      <span className="text-sm">
        Image {currentIndex + 1} of {totalImages}
      </span>
      <button
        className="btn btn-primary"
        onClick={onNext}
        disabled={currentIndex === totalImages - 1}
      >
        Next
      </button>
    </div>
  );
};

export default ImageNavigation; 