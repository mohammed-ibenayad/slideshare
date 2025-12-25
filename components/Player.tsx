import React, { useState, useEffect, useRef } from 'react';
import { Presentation } from '../types';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, Clock, MoreVertical, Flag, Heart, Share2, List, Download } from 'lucide-react';
import { Button } from './Button';

interface PlayerProps {
  presentation: Presentation;
  onClose: () => void;
}

export const Player: React.FC<PlayerProps> = ({ presentation, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          // Handled by browser usually, but good to have logic
        } else {
            // Optional: Close player on escape?
            // onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, isFullscreen, presentation.slides.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const nextSlide = () => {
    if (currentSlideIndex < presentation.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Injects a script to automatically scale the content to fit the horizontal width of the viewport.
   * Logic:
   * 1. Sets body width to fit-content to measure natural size.
   * 2. Calculates scale factor based on viewport width vs content width.
   * 3. Applies transform: scale().
   */
  const getScaledHtml = (htmlContent: string) => {
    const scaleScript = `
      <script>
        (function() {
          function fitToWidth() {
            var body = document.body;
            var html = document.documentElement;
            
            // Reset to measure
            body.style.width = 'fit-content';
            body.style.minWidth = '100%'; // Ensure it fills at least the screen for small text
            body.style.transform = '';
            body.style.margin = '0'; // Reset margin for calculation
            
            var viewportWidth = window.innerWidth;
            var contentWidth = body.scrollWidth;
            
            // If content is significantly different from viewport, scale it
            // Tolerance of 2px for float precision
            if (contentWidth > 0 && Math.abs(contentWidth - viewportWidth) > 2) {
               var scale = viewportWidth / contentWidth;
               body.style.transformOrigin = '0 0';
               body.style.transform = 'scale(' + scale + ')';
               
               // Adjust height to match scaled content so scrolling works
               // We need to keep the scrollable area correct
               // If we scale down, visual height decreases.
               // If we scale up, visual height increases.
               // The body transform handles the visual, but the window scrollbar depends on the bounding rect
               
               // Note: 'overflow-x: hidden' is important on html/body to prevent scrollbars from the unscaled width
               body.style.overflowX = 'hidden';
               html.style.overflowX = 'hidden';
            }
          }
          
          window.addEventListener('resize', fitToWidth);
          window.addEventListener('load', fitToWidth);
          // Run immediately in case load already fired
          setTimeout(fitToWidth, 0);
          // Run periodically for dynamic content
          setInterval(fitToWidth, 1000);
        })();
      </script>
    `;

    // Basic heuristic to inject script
    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${scaleScript}</body>`);
    } else {
      // It's a fragment, wrap it
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui, sans-serif; }
          </style>
        </head>
        <body>
          ${htmlContent}
          ${scaleScript}
        </body>
        </html>
      `;
    }
  };

  const handleDownload = () => {
    const slidesData = JSON.stringify(presentation.slides).replace(/<\/script/g, '<\\/script');
    const title = presentation.title;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - SlideShare HTML</title>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; font-family: system-ui, -apple-system, sans-serif; }
        iframe { width: 100%; height: 100%; border: none; background: white; transition: opacity 0.2s; }
        
        .controls { 
            position: fixed; 
            bottom: 20px; 
            left: 50%; 
            transform: translateX(-50%); 
            background: rgba(15, 23, 42, 0.8); 
            backdrop-filter: blur(8px);
            padding: 8px 16px; 
            border-radius: 9999px; 
            display: flex; 
            align-items: center;
            gap: 16px; 
            opacity: 0;
            transition: opacity 0.3s; 
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        body:hover .controls, .controls:focus-within { opacity: 1; }
        
        button { 
            background: rgba(255,255,255,0.1); 
            border: none; 
            color: white; 
            padding: 8px 12px; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
        }
        
        button:hover { background: rgba(255,255,255,0.2); transform: translateY(-1px); }
        button:active { transform: translateY(0); }
        button:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
        
        .counter { font-variant-numeric: tabular-nums; color: #94a3b8; font-size: 14px; }
    </style>
</head>
<body>
    <iframe id="slideFrame"></iframe>
    <div class="controls" id="controls">
        <button id="prevBtn" onclick="prevSlide()">Previous</button>
        <span class="counter" id="counter"></span>
        <button id="nextBtn" onclick="nextSlide()">Next</button>
    </div>

    <script>
        const slides = ${slidesData};
        let currentIndex = 0;
        const frame = document.getElementById('slideFrame');
        const counter = document.getElementById('counter');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        function loadSlide(index) {
            let content = slides[index];
            const scaleScript = \`<script>
                (function() {
                  function fitToWidth() {
                    var body = document.body;
                    var html = document.documentElement;
                    body.style.width = 'fit-content';
                    body.style.minWidth = '100%';
                    body.style.transform = '';
                    body.style.margin = '0';
                    var viewportWidth = window.innerWidth;
                    var contentWidth = body.scrollWidth;
                    if (contentWidth > 0 && Math.abs(contentWidth - viewportWidth) > 2) {
                       var scale = viewportWidth / contentWidth;
                       body.style.transformOrigin = '0 0';
                       body.style.transform = 'scale(' + scale + ')';
                       body.style.overflowX = 'hidden';
                       html.style.overflowX = 'hidden';
                    }
                  }
                  window.addEventListener('resize', fitToWidth);
                  window.addEventListener('load', fitToWidth);
                  setTimeout(fitToWidth, 0);
                })();
            <\\/script>\`;
            
            // Check if full HTML or fragment
            if (content.toLowerCase().includes('<body')) {
                if (content.includes('</body>')) {
                    content = content.replace('</body>', scaleScript + '</body>');
                } else {
                    content = content + scaleScript;
                }
            } else {
                 content = '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:system-ui,sans-serif;}</style></head><body>' + content + scaleScript + '</body></html>';
            }

            frame.style.opacity = '0';
            setTimeout(() => {
                frame.srcdoc = content;
                frame.onload = () => { frame.style.opacity = '1'; };
                
                counter.innerText = (index + 1) + ' / ' + slides.length;
                prevBtn.disabled = index === 0;
                nextBtn.disabled = index === slides.length - 1;
            }, 100);
        }

        function nextSlide() {
            if (currentIndex < slides.length - 1) {
                currentIndex++;
                loadSlide(currentIndex);
            }
        }

        function prevSlide() {
            if (currentIndex > 0) {
                currentIndex--;
                loadSlide(currentIndex);
            }
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Space') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        });

        loadSlide(0);
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_presentation.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black flex flex-col h-screen w-screen">
      {/* Top Bar (Auto-hides in fullscreen usually, but sticky here for demo) */}
      <div className={`flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur text-white border-b border-slate-800 ${isFullscreen ? 'opacity-0 hover:opacity-100 transition-opacity duration-300 absolute top-0 left-0 right-0 z-10' : ''}`}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="border-l border-slate-700 h-6 mx-2"></div>
          <div>
            <h1 className="text-sm font-bold truncate max-w-xs">{presentation.title}</h1>
            <p className="text-xs text-slate-400">by {presentation.authorName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 px-2 py-1 rounded text-xs font-mono">
                <Clock className="h-3 w-3" />
                {formatTime(elapsedTime)}
            </div>
             <div className="text-slate-400 text-xs px-2">
                Slide {currentSlideIndex + 1} / {presentation.slides.length}
            </div>
            <Button variant="ghost" size="sm"><Heart className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={handleDownload} title="Download HTML Player"><Download className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm"><Share2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {/* The Sandbox */}
        <iframe
            key={currentSlideIndex} // Force re-render on slide change
            ref={iframeRef}
            srcDoc={getScaledHtml(presentation.slides[currentSlideIndex])}
            title={`Slide ${currentSlideIndex + 1}`}
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-same-origin allow-popups"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
        />

        {/* Floating Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 rounded-full bg-slate-900/80 backdrop-blur border border-slate-700 shadow-2xl transition-opacity duration-300">
            <button 
                className="p-3 hover:bg-indigo-600 rounded-full transition text-white disabled:opacity-30 disabled:hover:bg-transparent" 
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
            >
                <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="text-sm font-medium text-slate-300 min-w-[3rem] text-center">
                {currentSlideIndex + 1} / {presentation.slides.length}
            </div>
            <button 
                className="p-3 hover:bg-indigo-600 rounded-full transition text-white disabled:opacity-30 disabled:hover:bg-transparent" 
                onClick={nextSlide}
                disabled={currentSlideIndex === presentation.slides.length - 1}
            >
                <ChevronRight className="h-6 w-6" />
            </button>
        </div>
      </div>
    </div>
  );
};