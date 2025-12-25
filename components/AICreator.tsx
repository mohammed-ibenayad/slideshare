import React, { useState, useEffect, useRef } from 'react';
import { Presentation, AIOutlineItem } from '../types';
import { Button } from './Button';
import { generateOutline, generateSlideHtml, extractDesignPattern, generateBulkSlide } from '../services/geminiService';
import { Wand2, ChevronRight, ChevronLeft, CheckCircle, RefreshCw, Layers, Play, StopCircle, Trash2, Send, Save, ArrowRight } from 'lucide-react';

interface AICreatorProps {
    onComplete: (p: Presentation) => void;
    onCancel: () => void;
}

type Step = 'INPUT' | 'OUTLINE' | 'DESIGN_INTERACTIVE' | 'PATTERN_ANALYSIS' | 'BULK_GENERATION' | 'REVIEW';

export const AICreator: React.FC<AICreatorProps> = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState<Step>('INPUT');
    const [loading, setLoading] = useState(false);
    
    // Step 1 Data
    const [topic, setTopic] = useState('');
    const [content, setContent] = useState('');
    const [audience, setAudience] = useState('');
    const [style, setStyle] = useState('Modern & Minimalist');

    // Step 2 Data
    const [outline, setOutline] = useState<AIOutlineItem[]>([]);

    // Step 3 Data
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [generatedSlides, setGeneratedSlides] = useState<string[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
    
    // Step 4 Data
    const [designPattern, setDesignPattern] = useState('');

    // Step 5 Data
    const [generationProgress, setGenerationProgress] = useState(0);

    const handleGenerateOutline = async () => {
        if (!topic) return;
        setLoading(true);
        try {
            const items = await generateOutline(topic, content, audience, style);
            setOutline(items);
            // Initialize generated slides array with empty strings matching outline length
            setGeneratedSlides(new Array(items.length).fill(''));
            setStep('OUTLINE');
        } catch (e) {
            console.error(e);
            alert("Failed to generate outline. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleStartDesign = () => {
        setStep('DESIGN_INTERACTIVE');
        // Trigger first slide generation automatically
        generateInteractiveSlide("Create the initial design for this slide based on the style preferences.");
    };

    const generateInteractiveSlide = async (instruction: string) => {
        setLoading(true);
        try {
            setChatHistory(prev => [...prev, { role: 'user', text: instruction }]);
            
            const currentHtml = generatedSlides[currentSlideIndex] || null;
            const outlineItem = outline[currentSlideIndex];
            
            // Context includes pattern if we are past the first few, but here we are in interactive mode (first 3)
            // We pass the global style preference + local context
            const html = await generateSlideHtml(outlineItem, instruction, currentHtml, style);
            
            const newSlides = [...generatedSlides];
            newSlides[currentSlideIndex] = html;
            setGeneratedSlides(newSlides);
            
            setChatHistory(prev => [...prev, { role: 'ai', text: "I've updated the slide design. How does it look?" }]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setChatInput('');
        }
    };

    const handleNextInteractiveSlide = async () => {
        if (currentSlideIndex < 2) { // 0, 1, 2 = 3 slides
            setCurrentSlideIndex(prev => prev + 1);
            setChatHistory([]); // Clear chat for new slide
            // Trigger initial gen for next slide
            // We can delay slightly or use effect, but direct call is fine
            setTimeout(() => {
                 generateInteractiveSlide("Create the initial design for this slide consistent with previous ones.");
            }, 100);
        } else {
            // Done with first 3
            setStep('PATTERN_ANALYSIS');
            analyzePattern();
        }
    };

    const analyzePattern = async () => {
        setLoading(true);
        try {
            const pattern = await extractDesignPattern(generatedSlides.slice(0, 3));
            setDesignPattern(pattern);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStartBulk = async () => {
        setStep('BULK_GENERATION');
        
        // Start from index 3
        const startIndex = 3;
        const total = outline.length;
        
        // Clone slides to avoid closure staleness issues in loop
        let currentSlidesState = [...generatedSlides];

        for (let i = startIndex; i < total; i++) {
            setGenerationProgress(((i - startIndex) / (total - startIndex)) * 100);
            try {
                const html = await generateBulkSlide(outline[i], designPattern);
                currentSlidesState[i] = html;
                setGeneratedSlides([...currentSlidesState]);
            } catch (e) {
                console.error(`Error generating slide ${i}`, e);
            }
        }
        setGenerationProgress(100);
        setTimeout(() => setStep('REVIEW'), 500);
    };

    const handleFinalize = () => {
        const title = outline[0]?.title || topic || "New Presentation";
        const desc = content.substring(0, 100) || "AI Generated Presentation";
        
        const newPresentation: Presentation = {
            id: Math.random().toString(36).substr(2, 9),
            title: title,
            description: desc,
            authorId: 'u1',
            authorName: 'You (AI Assisted)',
            thumbnailUrl: `https://picsum.photos/seed/${Math.random()}/400/225`, // Simple placeholder
            slides: generatedSlides.filter(s => s && s.length > 0),
            framework: "Custom HTML" as any,
            privacy: "Private" as any,
            views: 0,
            uploadedAt: new Date().toISOString(),
            tags: ['ai-generated']
        };
        onComplete(newPresentation);
    };

    // --- Render Helpers ---

    const renderInputStep = () => (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 mb-4">
                    <Wand2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">What would you like to present?</h2>
                <p className="text-slate-500">Provide a topic and context, and I'll draft the presentation for you.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Presentation Topic</label>
                <input 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., The Future of Renewable Energy"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Context / Raw Content</label>
                <textarea 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 h-32"
                    placeholder="Paste notes, key points, or a rough summary here..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Audience</label>
                    <input 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white"
                        placeholder="e.g., Investors, Students"
                        value={audience}
                        onChange={e => setAudience(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Visual Style</label>
                    <select 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white"
                        value={style}
                        onChange={e => setStyle(e.target.value)}
                    >
                        <option>Modern & Minimalist</option>
                        <option>Corporate & Professional</option>
                        <option>Bold & Vibrant</option>
                        <option>Dark & Futuristic</option>
                        <option>Soft & Elegant</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={handleGenerateOutline} isLoading={loading} disabled={!topic}>
                    Generate Outline <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    const renderOutlineStep = () => (
        <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] flex flex-col animate-in fade-in">
             <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Proposed Outline</h2>
                    <p className="text-sm text-slate-500">Review and refine the structure before we design.</p>
                </div>
                <Button onClick={handleStartDesign}>Start Designing <Layers className="ml-2 h-4 w-4" /></Button>
             </div>

             <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {outline.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex gap-4 group hover:border-indigo-500 transition-colors">
                        <div className="flex flex-col items-center gap-2 pt-1">
                            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs flex items-center justify-center font-bold text-slate-500">
                                {idx + 1}
                            </span>
                        </div>
                        <div className="flex-1">
                            <input 
                                className="font-bold text-slate-900 dark:text-white bg-transparent border-none p-0 focus:ring-0 w-full mb-1"
                                value={item.title}
                                onChange={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].title = e.target.value;
                                    setOutline(newOutline);
                                }}
                            />
                            <input 
                                className="text-sm text-slate-500 dark:text-slate-400 bg-transparent border-none p-0 focus:ring-0 w-full"
                                value={item.purpose}
                                onChange={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].purpose = e.target.value;
                                    setOutline(newOutline);
                                }}
                            />
                             <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {item.type}
                            </div>
                        </div>
                        <button 
                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all"
                            onClick={() => {
                                const newOutline = [...outline];
                                newOutline.splice(idx, 1);
                                setOutline(newOutline);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
             </div>
        </div>
    );

    const renderInteractiveStep = () => (
        <div className="flex h-[calc(100vh-140px)] -m-6">
            {/* Left Control Panel */}
            <div className="w-1/3 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-4">
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Design Phase</span>
                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                            Slide {currentSlideIndex + 1} / 3 (Interactive)
                        </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{outline[currentSlideIndex].title}</h3>
                    <p className="text-xs text-slate-500">{outline[currentSlideIndex].purpose}</p>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-bl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                             <div className="bg-white dark:bg-slate-800 p-3 rounded-lg rounded-bl-none border border-slate-200 dark:border-slate-700 flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                             </div>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <input 
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-10 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="Refine design (e.g. 'Make title bigger', 'Add icon')..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !loading && chatInput.trim()) {
                                generateInteractiveSlide(chatInput);
                            }
                        }}
                    />
                    <button 
                        className="absolute right-2 top-2 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        onClick={() => {
                            if (!loading && chatInput.trim()) generateInteractiveSlide(chatInput);
                        }}
                        disabled={loading || !chatInput.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-4 flex gap-2">
                     <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => generateInteractiveSlide("Try a different layout")}
                        disabled={loading}
                     >
                        <RefreshCw className="h-3 w-3 mr-2" /> Remix
                     </Button>
                     <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={handleNextInteractiveSlide}
                        disabled={loading || !generatedSlides[currentSlideIndex]}
                     >
                         {currentSlideIndex < 2 ? 'Next Slide' : 'Finish Design'} <ChevronRight className="h-3 w-3 ml-2" />
                     </Button>
                </div>
            </div>

            {/* Right Preview */}
            <div className="w-2/3 bg-black relative flex items-center justify-center overflow-hidden">
                {generatedSlides[currentSlideIndex] ? (
                    <iframe 
                        key={`${currentSlideIndex}-${generatedSlides[currentSlideIndex]?.length}`} // Force re-render on change
                        srcDoc={generatedSlides[currentSlideIndex]}
                        className="w-full h-full bg-white border-none"
                        title="Preview"
                        sandbox="allow-scripts" 
                    />
                ) : (
                    <div className="text-slate-500 flex flex-col items-center">
                        <Wand2 className="h-12 w-12 mb-4 opacity-50" />
                        <p>Generating preview...</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderPatternStep = () => (
        <div className="max-w-2xl mx-auto text-center py-12 animate-in fade-in">
             <div className="mb-8">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
                     <CheckCircle className="h-8 w-8" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Design Pattern Learned</h2>
                 <p className="text-slate-500 mt-2">I've analyzed your first 3 slides and extracted a design system.</p>
             </div>

             <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-left mb-8 max-h-60 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300 font-mono">
                    {loading ? "Analyzing..." : designPattern}
                </pre>
             </div>

             <Button onClick={handleStartBulk} size="lg" className="w-full sm:w-auto">
                 Generate Remaining {outline.length - 3} Slides <Play className="ml-2 h-4 w-4" />
             </Button>
        </div>
    );

    const renderBulkStep = () => (
        <div className="max-w-2xl mx-auto text-center py-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Generating Presentation</h2>
            
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-4 mb-4 overflow-hidden">
                <div 
                    className="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-out" 
                    style={{width: `${generationProgress}%`}}
                ></div>
            </div>
            
            <p className="text-slate-500 mb-8">
                Applying design pattern to slide {Math.min(outline.length, 3 + Math.floor((outline.length - 3) * (generationProgress/100)))} of {outline.length}...
            </p>

            <div className="grid grid-cols-4 gap-2 opacity-50">
                {generatedSlides.map((s, i) => (
                    <div key={i} className={`aspect-video rounded bg-slate-100 dark:bg-slate-800 border ${s ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700'}`}></div>
                ))}
            </div>
        </div>
    );

    const renderReviewStep = () => (
        <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in">
             <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white">Review & Finalize</h2>
                 <Button onClick={handleFinalize}><Save className="mr-2 h-4 w-4" /> Save Presentation</Button>
             </div>
             
             <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
                 {generatedSlides.map((html, idx) => (
                     <div key={idx} className="group relative aspect-video bg-white rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all">
                         <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur">
                             {idx + 1}
                         </div>
                         <iframe 
                            srcDoc={html} 
                            className="w-[200%] h-[200%] origin-top-left scale-50 pointer-events-none" 
                            tabIndex={-1}
                         />
                         <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors" />
                     </div>
                 ))}
             </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                        <Wand2 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-900 dark:text-white leading-tight">AI Presentation Creator</h1>
                        <p className="text-xs text-slate-500">Step: {step.replace('_', ' ')}</p>
                    </div>
                </div>
                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-black">
                {step === 'INPUT' && renderInputStep()}
                {step === 'OUTLINE' && renderOutlineStep()}
                {step === 'DESIGN_INTERACTIVE' && renderInteractiveStep()}
                {step === 'PATTERN_ANALYSIS' && renderPatternStep()}
                {step === 'BULK_GENERATION' && renderBulkStep()}
                {step === 'REVIEW' && renderReviewStep()}
            </div>
        </div>
    );
};
