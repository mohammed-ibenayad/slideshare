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
    <div className="space-y-12">
      {presentations.map((presentation) => (
        <div key={presentation.id} className="animate-in fade-in">
          {/* Presentation Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {presentation.title}
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {presentation.slides.length} slides
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {presentation.authorName}
              </span>
              <span>•</span>
              <span>{presentation.views.toLocaleString()} views</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs">
                {presentation.privacy}
              </span>
            </div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {presentation.description}
            </p>
          </div>

          {/* Slides Grid - Replicating AICreator's renderReviewStep layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
            {presentation.slides.map((html, idx) => (
              <div
                key={idx}
                className="group relative aspect-video bg-white rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer"
                onClick={() => onSlideClick(presentation, idx)}
              >
                {/* Slide Number Overlay */}
                <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur">
                  {idx + 1}
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
            ))}
          </div>

          {/* Divider between presentations */}
          {presentations.indexOf(presentation) < presentations.length - 1 && (
            <div className="mt-12 border-t border-slate-200 dark:border-slate-800" />
          )}
        </div>
      ))}
    </div>
  );
};
