import React, { useState, useEffect } from 'react';
import { Presentation } from '../types';
import { Play, Lock, Eye, Pencil } from 'lucide-react';
import { Button } from './Button';

interface DiscoveryGridProps {
  presentations: Presentation[];
  onSelect: (p: Presentation) => void;
  onEdit?: (p: Presentation) => void;
}

const PresentationCard: React.FC<{ p: Presentation; onSelect: (p: Presentation) => void; onEdit?: (p: Presentation) => void }> = ({ p, onSelect, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isHovered && p.slides && p.slides.length > 0) {
      const maxSlides = Math.min(3, p.slides.length);
      interval = setInterval(() => {
        setSlideIndex((prev) => (prev + 1) % maxSlides);
      }, 1500);
    } else {
      setSlideIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, p.slides]);

  return (
    <div 
        className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/10 transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail / Preview Area */}
      <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative overflow-hidden cursor-pointer" onClick={() => onSelect(p)}>
        {isHovered && p.slides && p.slides.length > 0 ? (
           <div className="w-full h-full bg-white relative animate-in fade-in duration-300">
             <iframe 
               srcDoc={p.slides[slideIndex]}
               className="absolute top-0 left-0 w-[400%] h-[400%] border-none origin-top-left pointer-events-none select-none"
               style={{ transform: 'scale(0.25)' }}
               title="Preview"
               sandbox="allow-scripts" 
               tabIndex={-1}
             />
             <div className="absolute inset-0 bg-transparent z-10" />
           </div>
        ) : (
            <>
                <img 
                    src={p.thumbnailUrl} 
                    alt={p.title} 
                    className="w-full h-full object-cover opacity-90 dark:opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 dark:from-slate-950/90 to-transparent"></div>
            </>
        )}
        
        {!isHovered && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                    <Play className="h-5 w-5 text-white ml-1" />
                </div>
            </div>
        )}

        {isHovered && p.slides && p.slides.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {Array.from({ length: Math.min(3, p.slides.length) }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${i === slideIndex ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-400/50'}`} 
                    />
                ))}
            </div>
        )}

        <div className="absolute top-2 right-2 z-20">
            <span className="text-xs font-bold px-2 py-1 rounded bg-black/50 backdrop-blur text-white border border-white/10 shadow-sm">
                {p.framework}
            </span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => onSelect(p)}>
                {p.title}
            </h3>
            {onEdit && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                    className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-white transition-colors p-1"
                    title="Edit Presentation"
                >
                    <Pencil className="h-4 w-4" />
                </button>
            )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 min-h-[2.5em]">
            {p.description}
        </p>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{p.authorName}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
                <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {p.views.toLocaleString()}
                </div>
                {p.privacy !== 'Public' && <Lock className="h-3 w-3" />}
            </div>
        </div>
      </div>
    </div>
  );
};

export const DiscoveryGrid: React.FC<DiscoveryGridProps> = ({ presentations, onSelect, onEdit }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {presentations.map((p) => (
        <PresentationCard key={p.id} p={p} onSelect={onSelect} onEdit={onEdit} />
      ))}
    </div>
  );
};