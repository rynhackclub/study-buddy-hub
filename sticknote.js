
import React from "react";
import Draggable from "react-draggable";
import { X } from "lucide-react";
import { StickyNote as IStickyNote } from "@/types/sticky-notes";
import { useStickyNotes } from "@/contexts/StickyNotesContext";

interface StickyNoteProps {
  note: IStickyNote;
}

const StickyNote = ({ note }: StickyNoteProps) => {
  const { 
    updateNoteContent, 
    deleteNote, 
    bringToFront, 
    updateNotePosition, 
    setEditingState 
  } = useStickyNotes();

  return (
    <Draggable
      position={note.position}
      onStart={() => bringToFront(note.id)}
      onStop={(_, data) => {
        updateNotePosition(note.id, data.x, data.y);
      }}
      bounds="parent"
      handle=".drag-handle"
    >
      <div
        className={`absolute ${note.color} rounded shadow-lg p-4 flex flex-col transition-all duration-200`}
        style={{ 
          zIndex: note.zIndex,
          width: note.isEditing ? '16rem' : '12rem',
          height: note.isEditing ? '16rem' : '12rem',
          transform: `scale(${note.isEditing ? 1 : 0.85})`,
        }}
        onClick={() => bringToFront(note.id)}
      >
        <div className="drag-handle cursor-move flex justify-between items-center mb-2">
          <div className="w-full h-6 flex items-center justify-center">
            <div className="w-16 h-1 bg-gray-400 rounded" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNote(note.id);
            }}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 bg-white/70 rounded-full p-1 hover:bg-white/90 transition-colors"
            aria-label="Delete note"
          >
            <X size={16} />
          </button>
        </div>
        <textarea
          className={`flex-1 w-full bg-transparent border-none resize-none focus:outline-none focus:ring-0 ${
            note.color.includes("yellow") ? "placeholder-yellow-600" : 
            note.color.includes("blue") ? "placeholder-blue-600" : 
            note.color.includes("green") ? "placeholder-green-600" : 
            note.color.includes("pink") ? "placeholder-pink-600" : 
            note.color.includes("purple") ? "placeholder-purple-600" : 
            "placeholder-orange-600"
          }`}
          placeholder="Write your note here..."
          value={note.content}
          onChange={(e) => updateNoteContent(note.id, e.target.value)}
          onFocus={() => setEditingState(note.id, true)}
          onBlur={() => setEditingState(note.id, false)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </Draggable>
  );
};

export default StickyNote;