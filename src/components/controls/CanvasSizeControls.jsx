import React from 'react';

const CanvasSizeControls = ({ displaySize, onSizeChange }) => {
  return (
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
          onChange={(e) => onSizeChange('width', e.target.value)}
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
          onChange={(e) => onSizeChange('height', e.target.value)}
          className="range range-primary"
          step="10"
        />
        <div className="w-full flex justify-between text-xs px-2 mt-1">
          <span>100px</span>
          <span>2000px</span>
        </div>
      </div>
    </div>
  );
};

export default CanvasSizeControls; 