import React, { useState, useEffect, useRef } from 'react';
import { Upload as UploadIcon, FileCode, CheckCircle, AlertCircle, Wand2, EyeOff, Loader2, Layers, Image as ImageIcon, Paintbrush, Lock, Globe, Edit, X, Save, Eye, MousePointer2, Code, Trash2, ZoomIn, Palette, Sparkles, Plus } from 'lucide-react';
import { Button } from './Button';
import { analyzePresentation, obfuscateContent, generateThumbnail, stylizeSlide, AnalysisResult } from '../services/geminiService';
import { Presentation, PresentationFramework, PrivacyMode } from '../types';
import { AICreator } from './AICreator';

interface UploadProps {
  onUploadComplete: (p: Presentation) => void;
  onCancel: () => void;
  initialPresentation?: Presentation | null;
}

const THUMBNAIL_STYLES = [
    'Modern',
    'Minimalist', 
    'Corporate', 
    'Cyberpunk', 
    'Abstract',
    'Dark Mode', 
    'Playful', 
    'Watercolor',
    'Geometric'
];

export const Upload: React.FC<UploadProps> = ({ onUploadComplete, onCancel, initialPresentation }) => {
  // Mode selection state
  const [creationMode, setCreationMode] = useState<'SELECT' | 'FILE' | 'AI'>(initialPresentation ? 'FILE' : 'SELECT');

  const [files, setFiles] = useState<File[]>([]);
  const [slidesContent, setSlidesContent] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [isStylizing, setIsStylizing] = useState(false);
  const [metadata, setMetadata] = useState<AnalysisResult | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<PrivacyMode>(PrivacyMode.PUBLIC);
  const [useThumbnailAsCover, setUseThumbnailAsCover] = useState(false);
  const [slidesStyled, setSlidesStyled] = useState(false);
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false);
  const [thumbnailStyle, setThumbnailStyle] = useState<string>('Modern');

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [editorMode, setEditorMode] = useState<'CODE' | 'VISUAL'>('VISUAL');
  
  // Initialize state if editing an existing presentation
  useEffect(() => {
    if (initialPresentation) {
      setSlidesContent(initialPresentation.slides);
      setMetadata({
        title: initialPresentation.title,
        description: initialPresentation.description,
        tags: initialPresentation.tags,
        framework: initialPresentation.framework,
        isObfuscatedCandidate: false // Default/Assumption
      });
      setThumbnailUrl(initialPresentation.thumbnailUrl);
      setPrivacy(initialPresentation.privacy);
      // We don't have the original File objects, but that's okay for editing content
    }
  }, [initialPresentation]);

  // Listener for Visual Editor updates
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SLIDE_UPDATE' && isEditorOpen && editorMode === 'VISUAL') {
        const newContent = event.data.content;
        setSlidesContent(prev => {
          const updated = [...prev];
          // Update only if changed to avoid loops (though strict equality might fail on large strings)
          if (updated[activeSlideIndex] !== newContent) {
            updated[activeSlideIndex] = newContent;
            return updated;
          }
          return prev;
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isEditorOpen, editorMode, activeSlideIndex]);

  const processFileContent = (html: string): string[] => {
      // Basic check to avoid parsing non-html files unnecessarily
      if (!html.includes('<html') && !html.includes('<!DOCTYPE')) return [html];

      try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Look for standard Reveal.js container: .reveal > .slides > section
          const revealElement = doc.querySelector('.reveal');
          const slidesElement = doc.querySelector('.reveal .slides');
          
          if (revealElement && slidesElement) {
              const sections = Array.from(slidesElement.children).filter(el => el.tagName.toLowerCase() === 'section');
              
              // Only split if we actually find Reveal.js sections
              if (sections.length > 0) {
                  const extractedSlides: string[] = [];

                  // Helper to get attributes
                  const getAttrs = (el: Element | null) => {
                      if (!el) return '';
                      return Array.from(el.attributes).map(a => `${a.name}="${a.value}"`).join(' ');
                  };

                  const htmlAttrs = getAttrs(doc.documentElement);
                  const bodyAttrs = getAttrs(doc.body);
                  const revealAttrs = getAttrs(revealElement);
                  const slidesAttrs = getAttrs(slidesElement);
                  const headContent = doc.head.innerHTML;

                  // Recursive function to flatten slides (handle vertical slides)
                  const flattenSlides = (element: Element) => {
                      const subSections = Array.from(element.children).filter(c => c.tagName.toLowerCase() === 'section');
                      
                      if (subSections.length > 0) {
                          subSections.forEach(sub => flattenSlides(sub));
                      } else {
                          // It's a leaf slide - construct isolated HTML
                          // We inject styles to ensure visibility without Reveal.js JS needing to run
                          const slideHtml = `<!DOCTYPE html>
<html ${htmlAttrs}>
<head>
${headContent}
<style>
    /* Gemini App: Styles injected to ensure isolated Reveal.js slide visibility */
    html, body { height: 100%; margin: 0; overflow: hidden; }
    .reveal { height: 100% !important; width: 100% !important; }
    .reveal .slides { 
        height: 100% !important; 
        width: 100% !important; 
        display: flex !important;
        align-items: center;
        justify-content: center;
        transform: none !important;
        text-align: center;
        pointer-events: none;
    }
    .reveal .slides section {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        pointer-events: auto !important;
        /* Allow natural sizing but constrain to viewport if needed */
        max-width: 100%;
        max-height: 100%;
        margin: auto;
    }
</style>
</head>
<body ${bodyAttrs}>
  <div ${revealAttrs}>
    <div ${slidesAttrs}>
      ${element.outerHTML}
    </div>
  </div>
  <script>
    // Disable Reveal auto-init if present to prevent errors in isolated view
    window.Reveal = { initialize: () => {}, isReady: () => true, layout: () => {} };
  </script>
</body>
</html>`;
                          extractedSlides.push(slideHtml);
                      }
                  };

                  sections.forEach(section => flattenSlides(section));
                  
                  if (extractedSlides.length > 0) {
                      return extractedSlides;
                  }
              }
          }
      } catch (e) {
          console.error("Error parsing HTML for slides:", e);
      }

      return [html];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles: File[] = Array.from(e.target.files);
      // Sort files by name to ensure order
      selectedFiles.sort((a, b) => a.name.localeCompare(b.name));
      
      setFiles(selectedFiles);
      
      const contents: string[] = [];
      for (const file of selectedFiles) {
          const text = await file.text();
          // Process file content to detect multiple slides (Reveal.js)
          const processedSlides = processFileContent(text);
          contents.push(...processedSlides);
      }
      setSlidesContent(contents);
      setMetadata(null);
      setThumbnailUrl(null);
      setUseThumbnailAsCover(false);
      setSlidesStyled(false);
    }
  };

  const handleAnalyze = async () => {
    if (slidesContent.length === 0) return;
    setIsAnalyzing(true);
    setIsGeneratingThumbnail(true);
    
    // Run analysis and thumbnail generation in parallel
    const sampleContent = slidesContent.map(s => s.substring(0, 2000)).join('\n\n--- SLIDE BREAK ---\n\n');
    
    // 1. Metadata Analysis
    analyzePresentation(sampleContent)
      .then(result => {
        setMetadata(result);
        setIsAnalyzing(false);
      })
      .catch(err => {
        console.error(err);
        setIsAnalyzing(false);
      });

    // 2. Thumbnail Generation (from first slide, using current style)
    generateThumbnail(slidesContent[0], thumbnailStyle)
      .then(url => {
        if (url) {
            setThumbnailUrl(url);
            setUseThumbnailAsCover(true); // Default to true when generated
        }
        setIsGeneratingThumbnail(false);
      })
      .catch(err => {
        console.error(err);
        setIsGeneratingThumbnail(false);
      });
  };

  const handleRegenerateThumbnail = async () => {
      setIsGeneratingThumbnail(true);
      const url = await generateThumbnail(slidesContent[0], thumbnailStyle);
      if (url) {
          setThumbnailUrl(url);
      }
      setIsGeneratingThumbnail(false);
  };

  const handleObfuscate = async () => {
     if (slidesContent.length === 0) return;
     setIsAnalyzing(true);
     try {
         // Process all slides in parallel
         const newSlides = await Promise.all(
            slidesContent.map(slide => obfuscateContent(slide))
         );
         setSlidesContent(newSlides);
         setPrivacy(PrivacyMode.SAMPLE_OBFUSCATED);
         // Re-analyze lightly to confirm
         setMetadata(prev => prev ? {...prev, title: `[SAMPLE] ${prev.title}`, description: "This is an obfuscated sample."} : null);
     } catch (err) {
         console.error(err);
     } finally {
         setIsAnalyzing(false);
     }
  };

  const handleStylizeSlides = async () => {
    if (!thumbnailUrl || slidesContent.length === 0) return;
    setIsStylizing(true);
    try {
        // Only stylize first 2 slides
        const slidesToStyle = slidesContent.slice(0, 2);
        const newStyledSlides = await Promise.all(
            slidesToStyle.map(slide => stylizeSlide(slide, thumbnailUrl))
        );

        // Update state with new slides
        const updatedSlides = [...slidesContent];
        updatedSlides[0] = newStyledSlides[0];
        if (updatedSlides.length > 1) {
            updatedSlides[1] = newStyledSlides[1];
        }
        setSlidesContent(updatedSlides);
        setSlidesStyled(true);
    } catch (err) {
        console.error("Failed to stylize slides", err);
    } finally {
        setIsStylizing(false);
    }
  };

  const handleStylizeSingleSlide = async () => {
    if (!thumbnailUrl || !slidesContent[activeSlideIndex]) return;
    setIsStylizing(true);
    try {
        const styledHtml = await stylizeSlide(slidesContent[activeSlideIndex], thumbnailUrl);
        const updatedSlides = [...slidesContent];
        updatedSlides[activeSlideIndex] = styledHtml;
        setSlidesContent(updatedSlides);
    } catch (err) {
        console.error("Failed to stylize slide", err);
    } finally {
        setIsStylizing(false);
    }
  };

  const handleSlideContentChange = (newContent: string) => {
      const updatedSlides = [...slidesContent];
      updatedSlides[activeSlideIndex] = newContent;
      setSlidesContent(updatedSlides);
  };

  const handleDeleteSlide = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    
    if (slidesContent.length <= 1) {
        alert("Presentation must have at least one slide.");
        return;
    }

    const newSlides = [...slidesContent];
    newSlides.splice(index, 1);
    setSlidesContent(newSlides);
    
    // Update active index if needed
    if (activeSlideIndex >= newSlides.length) {
        setActiveSlideIndex(newSlides.length - 1);
    } else if (index < activeSlideIndex) {
        setActiveSlideIndex(activeSlideIndex - 1);
    }
    
    // Sync files array if it matches (only relevant for fresh uploads)
    if (files.length > 0 && files.length > index) {
         const newFiles = [...files];
         newFiles.splice(index, 1);
         setFiles(newFiles);
    }
  };

  const handlePublish = () => {
    if (!metadata || slidesContent.length === 0) return;

    let finalSlides = [...slidesContent];

    if (useThumbnailAsCover && thumbnailUrl) {
        // Create a cover slide using the thumbnail and metadata
        const coverSlide = `
            <div style="width: 100vw; height: 100vh; position: relative; background: #020617; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif;">
                <div style="position: absolute; inset: 0; z-index: 0; opacity: 0.5;">
                    <img src="${thumbnailUrl}" style="width: 100%; height: 100%; object-fit: cover; filter: blur(8px) brightness(0.7); transform: scale(1.1);">
                </div>
                <div style="position: relative; z-index: 10; text-align: center; padding: 2rem; max-width: 90%; width: 1000px;">
                     <div style="margin-bottom: 2rem; border-radius: 1rem; overflow: hidden; box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.7); display: inline-block; border: 1px solid rgba(255,255,255,0.1);">
                        <img src="${thumbnailUrl}" style="max-height: 400px; width: auto; max-width: 100%; display: block;">
                     </div>
                    <h1 style="font-size: clamp(2.5rem, 5vw, 4.5rem); font-weight: 800; color: white; margin: 0 0 1rem 0; line-height: 1.1; text-shadow: 0 4px 12px rgba(0,0,0,0.5); letter-spacing: -0.02em;">${metadata.title}</h1>
                    <p style="font-size: clamp(1.1rem, 2vw, 1.5rem); color: #e2e8f0; margin: 0 auto; line-height: 1.6; text-shadow: 0 2px 4px rgba(0,0,0,0.5); max-width: 800px;">${metadata.description}</p>
                </div>
            </div>
        `;
        finalSlides.unshift(coverSlide);
    }

    const newPresentation: Presentation = {
      id: initialPresentation?.id || Math.random().toString(36).substr(2, 9),
      title: metadata.title,
      description: metadata.description,
      authorId: initialPresentation?.authorId || 'u1',
      authorName: initialPresentation?.authorName || 'Demo User',
      thumbnailUrl: thumbnailUrl || `https://picsum.photos/400/225?random=${Math.floor(Math.random() * 1000)}`,
      slides: finalSlides,
      framework: metadata.framework as PresentationFramework || PresentationFramework.CUSTOM,
      privacy: privacy,
      views: initialPresentation?.views || 0,
      uploadedAt: initialPresentation?.uploadedAt || new Date().toISOString(),
      tags: metadata.tags,
    };

    onUploadComplete(newPresentation);
  };

  const getVisualEditorHtml = (html: string) => {
      // Inject script to make text editable and sync changes
      const script = `
        <style id="gemini-editor-style">
          [contenteditable="true"]:hover { outline: 2px dashed #6366f1; cursor: text; }
          [contenteditable="true"]:focus { outline: 2px solid #6366f1; background: rgba(99, 102, 241, 0.1); }
        </style>
        <script id="gemini-editor-script">
          (function() {
            function makeTextEditable() {
              // Make standard text containers editable
              const all = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, li, a, td, th, div:not(:has(div))');
              all.forEach(el => {
                 // Check if it has direct text nodes
                 const hasText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
                 if (hasText) {
                   el.contentEditable = "true";
                 }
              });
            }
            
            // Run initially
            makeTextEditable();
            // Retry for dynamic content
            setTimeout(makeTextEditable, 500);

            let timeout;
            const notify = () => {
               clearTimeout(timeout);
               timeout = setTimeout(() => {
                  const clone = document.documentElement.cloneNode(true);
                  const s = clone.querySelector('#gemini-editor-script');
                  const st = clone.querySelector('#gemini-editor-style');
                  if(s) s.remove();
                  if(st) st.remove();
                  
                  window.parent.postMessage({
                      type: 'SLIDE_UPDATE',
                      content: clone.outerHTML
                  }, '*');
               }, 300);
            }

            document.body.addEventListener('input', notify);
            document.body.addEventListener('blur', notify, true);
          })();
        </script>
      `;
      
      if (html.includes('</body>')) {
          return html.replace('</body>', `${script}</body>`);
      }
      return `<!DOCTYPE html><html><body>${html}${script}</body></html>`;
  };

  // 1. Selection Mode (Entry point)
  if (creationMode === 'SELECT') {
      return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl p-8">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create a Presentation</h2>
                    <p className="text-slate-500">Choose how you want to start building your deck.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {/* Option A: Upload */}
                    <button 
                        onClick={() => setCreationMode('FILE')}
                        className="group flex flex-col items-center p-8 border-2 border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                            <UploadIcon className="h-8 w-8 text-slate-600 dark:text-slate-300 group-hover:text-indigo-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Upload Files</h3>
                        <p className="text-sm text-slate-500">Import existing .html slides or reveal.js presentations.</p>
                    </button>

                    {/* Option B: AI Create */}
                    <button 
                         onClick={() => setCreationMode('AI')}
                         className="group flex flex-col items-center p-8 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-1">
                            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">NEW</span>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-4 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors">
                            <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Create with AI</h3>
                        <p className="text-sm text-slate-500">Generate a deck from a topic using our progressive AI wizard.</p>
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                </div>
            </div>
        </div>
      );
  }

  // 2. AI Creator Mode
  if (creationMode === 'AI') {
      return <AICreator onComplete={onUploadComplete} onCancel={() => setCreationMode('SELECT')} />;
  }

  // 3. Editor View (Existing Logic)
  if (isEditorOpen) {
      return (
          <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
              <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900">
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                          <Edit className="h-4 w-4 text-indigo-500" />
                          <span className="font-bold text-white">Slide Editor</span>
                          <span className="text-slate-500 text-sm hidden sm:inline">| {initialPresentation ? initialPresentation.title : (files[activeSlideIndex]?.name || `Slide ${activeSlideIndex + 1}`)}</span>
                      </div>
                      
                      {/* Mode Toggle */}
                      <div className="bg-slate-800 rounded-lg p-1 flex text-xs">
                          <button 
                            onClick={() => setEditorMode('VISUAL')}
                            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${editorMode === 'VISUAL' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                          >
                             <MousePointer2 className="h-3 w-3" /> Visual
                          </button>
                          <button 
                            onClick={() => setEditorMode('CODE')}
                            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${editorMode === 'CODE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                          >
                             <Code className="h-3 w-3" /> Source
                          </button>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                       {/* Apply Theme to Current Slide */}
                      <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={handleStylizeSingleSlide} 
                          isLoading={isStylizing}
                          disabled={!thumbnailUrl}
                          title={!thumbnailUrl ? "Generate a thumbnail first to apply its theme" : "Apply thumbnail style to this slide"}
                      >
                          <Paintbrush className="h-4 w-4 mr-2" />
                          Apply Theme
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setIsEditorOpen(false)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Done Editing
                      </Button>
                  </div>
              </div>
              <div className="flex-1 flex overflow-hidden">
                  {/* Slide List Sidebar */}
                  <div className="w-48 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto">
                      <div className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Slides</div>
                      {slidesContent.map((_, index) => (
                          <div
                              key={index}
                              onClick={() => setActiveSlideIndex(index)}
                              className={`group flex items-center justify-between px-4 py-3 text-sm border-l-2 transition-colors cursor-pointer ${
                                  activeSlideIndex === index 
                                  ? 'bg-slate-800 border-indigo-500 text-white' 
                                  : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                              }`}
                          >
                              <span className="truncate w-full">Slide {index + 1}</span>
                               <button 
                                onClick={(e) => handleDeleteSlide(e, index)}
                                className="ml-2 p-1 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete slide"
                               >
                                 <Trash2 className="h-3 w-3" />
                               </button>
                          </div>
                      ))}
                  </div>

                  {/* Editor Area */}
                  <div className="flex-1 flex flex-col md:flex-row bg-black">
                      {/* Code Input (Visible only in CODE mode) */}
                      {editorMode === 'CODE' && (
                          <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-950">
                               <div className="bg-slate-900/50 px-4 py-2 text-xs text-slate-400 flex items-center justify-between border-b border-slate-800">
                                   <span className="flex items-center gap-2"><FileCode className="h-3 w-3" /> HTML Source</span>
                               </div>
                               <textarea
                                    className="flex-1 w-full bg-slate-950 text-slate-300 font-mono text-sm p-4 focus:outline-none resize-none selection:bg-indigo-500/30"
                                    value={slidesContent[activeSlideIndex]}
                                    onChange={(e) => handleSlideContentChange(e.target.value)}
                                    spellCheck={false}
                               />
                          </div>
                      )}

                      {/* Live Preview (Visual Mode handles editing inside iframe) */}
                      <div className="flex-1 flex flex-col h-full">
                           <div className="bg-slate-900/50 px-4 py-2 text-xs text-slate-400 flex items-center justify-between border-b border-slate-800">
                               <span className="flex items-center gap-2">
                                 <Eye className="h-3 w-3" /> 
                                 {editorMode === 'VISUAL' ? 'Interactive Visual Editor' : 'Live Preview'}
                               </span>
                               {editorMode === 'VISUAL' && <span className="text-indigo-400">Click text to edit</span>}
                           </div>
                           <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-white/5">
                                <iframe
                                    key={`${activeSlideIndex}-${editorMode}`} // Re-render when toggling modes to inject/remove scripts cleanly
                                    srcDoc={editorMode === 'VISUAL' ? getVisualEditorHtml(slidesContent[activeSlideIndex]) : slidesContent[activeSlideIndex]}
                                    title="Preview"
                                    className="w-full h-full bg-white border-none"
                                    sandbox="allow-scripts allow-same-origin" 
                                />
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // 4. Normal Upload View (Existing Logic)
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-colors duration-300">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{initialPresentation ? 'Edit Presentation' : 'Upload Presentation'}</h2>
            <div className="flex gap-2">
                {creationMode === 'FILE' && (
                    <Button variant="ghost" size="sm" onClick={() => setCreationMode('SELECT')}>
                        Switch Mode
                    </Button>
                )}
                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            </div>
        </div>

        <div className="p-8">
          {slidesContent.length === 0 ? (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center hover:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-900/50">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700">
                <UploadIcon className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Drag and drop your HTML slides</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Select multiple .html files to create a deck.</p>
              <label className="cursor-pointer">
                <input type="file" className="hidden" multiple accept=".html,.htm" onChange={handleFileChange} />
                <span className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition">Browse Files</span>
              </label>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col gap-2 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-transparent">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-slate-900 dark:text-white font-medium">{slidesContent.length} Slide{slidesContent.length !== 1 ? 's' : ''}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">{files.length > 0 ? `${(files.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1)} KB` : 'Existing content loaded'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setIsEditorOpen(true)}>
                            <Edit className="h-3 w-3 mr-1" /> Edit Slides
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setFiles([]); setSlidesContent([]); setMetadata(null); setThumbnailUrl(null); }}>Change</Button>
                    </div>
                </div>
                
                <div className="space-y-1 pl-12">
                    {files.length > 0 ? files.slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                             <FileCode className="h-3 w-3 text-slate-400 dark:text-slate-500" /> {f.name}
                        </div>
                    )) : (
                        <div className="text-xs text-slate-500 italic">Editing existing content...</div>
                    )}
                </div>
              </div>

              {!metadata ? (
                 <div className="text-center py-6">
                    <p className="text-slate-500 dark:text-slate-300 mb-4">Files loaded. Let AI analyze metadata and generate a thumbnail.</p>
                    <Button onClick={handleAnalyze} isLoading={isAnalyzing} className="w-full sm:w-auto">
                        <Wand2 className="mr-2 h-4 w-4" /> Analyze Deck with Gemini
                    </Button>
                 </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                    {/* Left Column: Metadata */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Title</label>
                                    <input 
                                        type="text" 
                                        value={metadata.title} 
                                        onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Framework Detected</label>
                                    <div className="text-indigo-600 dark:text-indigo-400 font-mono text-sm bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                                        {metadata.framework}
                                    </div>
                                </div>
                            </div>
                            <div>
                                 <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                                 <textarea 
                                    rows={4}
                                    value={metadata.description}
                                    onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                                 />
                            </div>
                        </div>

                        {/* Privacy & Obfuscation Section */}
                        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                            <h4 className="text-slate-900 dark:text-white font-medium mb-3 flex items-center gap-2">
                                <EyeOff className="h-4 w-4 text-slate-500 dark:text-slate-400" /> Privacy & Obfuscation
                            </h4>
                            
                            {metadata.isObfuscatedCandidate && privacy !== PrivacyMode.SAMPLE_OBFUSCATED && (
                                 <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 p-3 rounded-lg mb-4 flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
                                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                        <span className="font-bold">Privacy Alert:</span> We detected potential PII or confidential data. consider creating an obfuscated sample.
                                    </div>
                                 </div>
                            )}

                            {/* Privacy Toggle */}
                            <div className="flex items-center justify-between w-full bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 mb-4">
                                <div className="flex items-center gap-3">
                                    {privacy === PrivacyMode.PRIVATE ? (
                                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                                            <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                             <Globe className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                                            {privacy === PrivacyMode.PRIVATE ? 'Private Access' : 'Public Access'}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {privacy === PrivacyMode.PRIVATE 
                                                ? 'Only you can view this presentation' 
                                                : 'Anyone with the link can view'}
                                        </span>
                                    </div>
                                </div>
                                
                                <button 
                                    type="button"
                                    onClick={() => setPrivacy(privacy === PrivacyMode.PRIVATE ? PrivacyMode.PUBLIC : PrivacyMode.PRIVATE)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 ${privacy === PrivacyMode.PRIVATE ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacy === PrivacyMode.PRIVATE ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex-1"></div>

                                {privacy !== PrivacyMode.SAMPLE_OBFUSCATED && (
                                    <Button variant="secondary" size="sm" onClick={handleObfuscate} isLoading={isAnalyzing}>
                                        Generate Obfuscated Copy
                                    </Button>
                                )}
                                
                                {privacy === PrivacyMode.SAMPLE_OBFUSCATED && (
                                    <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1">
                                        <CheckCircle className="h-4 w-4" /> Content Obfuscated
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Thumbnail */}
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center justify-between">
                            <span>Thumbnail Style</span>
                            <span className="text-indigo-500 text-xs font-semibold">{thumbnailStyle}</span>
                        </label>
                        
                        {/* Style Selector */}
                        <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                                {THUMBNAIL_STYLES.map(style => (
                                    <button
                                        key={style}
                                        onClick={() => setThumbnailStyle(style)}
                                        className={`px-3 py-1 text-xs rounded-full border transition-all ${
                                            thumbnailStyle === style
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                                        }`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="aspect-video bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden relative group">
                            {isGeneratingThumbnail ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                    <Loader2 className="h-8 w-8 animate-spin mb-2 text-indigo-500" />
                                    <span className="text-xs">Generating {thumbnailStyle} thumbnail...</span>
                                </div>
                            ) : thumbnailUrl ? (
                                <>
                                    <img src={thumbnailUrl} alt="Generated Thumbnail" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 items-center justify-center">
                                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 hover:text-white" onClick={() => setIsThumbnailModalOpen(true)}>
                                            <ZoomIn className="h-4 w-4 mr-2" /> View
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 hover:text-white" onClick={handleRegenerateThumbnail}>
                                            <Wand2 className="h-4 w-4 mr-2" /> Regenerate
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                                    <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                                    <span className="text-xs">No thumbnail available</span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Generated by Gemini based on your first slide's content.
                        </p>
                        
                        {thumbnailUrl && (
                             <div className="mt-4 space-y-3">
                                 {/* Use as Cover Option */}
                                 <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <input 
                                        type="checkbox" 
                                        id="useCover" 
                                        checked={useThumbnailAsCover} 
                                        onChange={(e) => setUseThumbnailAsCover(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 shrink-0"
                                    />
                                    <label htmlFor="useCover" className="text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                                        <span className="font-medium text-slate-900 dark:text-white block">Use as Cover Slide</span>
                                        <span className="text-slate-500 text-xs">Adds a title slide with this image and the presentation title.</span>
                                    </label>
                                </div>

                                {/* Style Transfer Option */}
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="w-full flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                                    onClick={handleStylizeSlides}
                                    isLoading={isStylizing}
                                    disabled={slidesStyled}
                                >
                                    {slidesStyled ? (
                                        <>
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            Style Applied
                                        </>
                                    ) : (
                                        <>
                                            <Paintbrush className="h-4 w-4" />
                                            Apply Theme to First 2 Slides
                                        </>
                                    )}
                                </Button>
                                {slidesStyled && (
                                    <p className="text-xs text-green-500 text-center animate-pulse">
                                        Slides 1 & 2 updated to match thumbnail style!
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-3 pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                        <Button onClick={handlePublish}>{initialPresentation ? 'Save Changes' : 'Publish Presentation'}</Button>
                    </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {isThumbnailModalOpen && thumbnailUrl && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsThumbnailModalOpen(false)}>
           <button className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full" onClick={() => setIsThumbnailModalOpen(false)}>
             <X className="h-8 w-8" />
           </button>
           <img src={thumbnailUrl} className="max-w-full max-h-[90vh] rounded shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};
