import React from 'react';

const FileInput = ({ onFileSelect }) => {
  return (
    <div className="form-control w-full max-w-xs">
      <label className="label">
        <span className="label-text">Choose photos</span>
      </label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={onFileSelect}
        className="file-input file-input-bordered w-full max-w-xs"
      />
    </div>
  );
};

export default FileInput; 