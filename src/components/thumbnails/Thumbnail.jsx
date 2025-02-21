import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

const Thumbnail = ({ 
  file, 
  index, 
  isSelected, 
  fitMode,
  onSelect, 
  onFitModeChange 
}) => {
  const thumbnailUrl = URL.createObjectURL(file);

  return (
    <Draggable draggableId={`thumb-${index}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            relative cursor-pointer rounded-lg overflow-hidden
            hover:ring-2 hover:ring-primary transition-all
            ${isSelected ? 'ring-2 ring-primary' : ''}
          `}
        >
          <div 
            onClick={onSelect}
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
              className="checkbox checkbox-primary checkbox-xs [--chkfg:transparent] checked:rounded-none"
              checked={fitMode === 'contain'}
              onChange={(e) => {
                e.stopPropagation();
                onFitModeChange(e.target.checked ? 'contain' : 'cover');
              }}
            />
          </label>
        </div>
      )}
    </Draggable>
  );
};

export default Thumbnail; 