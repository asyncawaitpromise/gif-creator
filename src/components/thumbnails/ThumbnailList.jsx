import React from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import Thumbnail from './Thumbnail';

const ThumbnailList = ({ 
  files, 
  currentIndex,
  fitModes,
  onDragEnd,
  onSelect,
  onFitModeChange
}) => {
  const handleFitModeChange = (index, mode, event) => {
    // Only stop propagation, don't prevent default
    event?.stopPropagation();
    onFitModeChange(index, mode);
  };

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold mb-2">Selected Photos</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="thumbnails" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-wrap gap-2 p-2 border border-base-300 rounded-lg overflow-x-auto min-h-[120px]"
            >
              {files.map((file, index) => (
                <Thumbnail
                  key={index}
                  file={file}
                  index={index}
                  isSelected={currentIndex === index}
                  fitMode={fitModes[index]}
                  onSelect={() => onSelect(index)}
                  onFitModeChange={(mode, event) => handleFitModeChange(index, mode, event)}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default ThumbnailList; 