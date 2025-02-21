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

  const handleCheckboxChange = (e) => {
    // Only stop propagation, don't prevent default
    e.stopPropagation();
    
    // Pass both the new mode and the event
    onFitModeChange(
      e.target.checked ? 'contain' : 'cover',
      e
    );
  };

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
          <div 
            className="absolute top-1 right-1"
            onClick={e => e.stopPropagation()}
          >
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-xs [--chkfg:transparent] checked:rounded-none"
              checked={fitMode === 'contain'}
              onChange={handleCheckboxChange}
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default Thumbnail; 