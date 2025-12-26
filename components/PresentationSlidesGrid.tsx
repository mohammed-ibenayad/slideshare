import React from 'react';
import { Presentation } from '../types';

interface PresentationSlidesGridProps {
  presentations: Presentation[];
  onSlideClick: (presentation: Presentation, slideIndex: number) => void;
}

export const PresentationSlidesGrid: React.FC<PresentationSlidesGridProps> = ({
  presentations,
  onSlideClick
}) => {
  return (
    <div className="h-[calc(100vh-200px)] flex flex-col animate-in fade-in">
      {/* Compact header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">All Presentations</h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {presentations.reduce((sum, p) => sum + p.slides.length, 0)} slides total
        </span>
      </div>

      {/* Scrollable grid container - exact same as AICreator review */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
        {presentations.map((presentation) =>
          presentation.slides.map((html, idx) => (
            <div
              key={`${presentation.id}-${idx}`}
              className="group relative aspect-video bg-white rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer"
              onClick={() => onSlideClick(presentation, idx)}
            >
              {/* Presentation name badge - top left */}
              <div className="absolute top-2 left-2 z-10 bg-indigo-600/90 text-white text-xs px-2 py-1 rounded backdrop-blur font-medium">
                {presentation.title}
              </div>

              {/* Slide number - top right */}
              <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur">
                {idx + 1}/{presentation.slides.length}
              </div>

              {/* Slide Preview - Same scaling as AICreator review step */}
              <iframe
                srcDoc={html}
                className="w-[200%] h-[200%] origin-top-left scale-50 pointer-events-none"
                tabIndex={-1}
                title={`${presentation.title} - Slide ${idx + 1}`}
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
