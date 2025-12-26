import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DiscoveryGrid } from './components/DiscoveryGrid';
import { PresentationSlidesGrid } from './components/PresentationSlidesGrid';
import { Player } from './components/Player';
import { Upload } from './components/Upload';
import { Analytics } from './components/Analytics';
import { MOCK_PRESENTATIONS } from './constants';
import { Presentation, ViewState } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [presentations, setPresentations] = useState<Presentation[]>(MOCK_PRESENTATIONS);
  const [activePresentation, setActivePresentation] = useState<Presentation | null>(null);
  const [presentationToEdit, setPresentationToEdit] = useState<Presentation | null>(null);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Main View Mode (cards or slideGrid)
  const [mainViewMode, setMainViewMode] = useState<'cards' | 'slideGrid'>('cards');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleMainViewMode = () => {
    setMainViewMode(prev => prev === 'cards' ? 'slideGrid' : 'cards');
  };

  const handlePresentationSelect = (p: Presentation, slideIndex: number = 0) => {
    setActivePresentation(p);
    setCurrentView('PLAYER');
  };

  const handlePresentationEdit = (p: Presentation) => {
    setPresentationToEdit(p);
    setCurrentView('UPLOAD');
  };

  const handleUploadComplete = (p: Presentation) => {
    setPresentations(prev => {
      // If editing existing, replace it. Otherwise add new.
      const exists = prev.findIndex(item => item.id === p.id);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = p;
        return updated;
      }
      return [p, ...prev];
    });
    setPresentationToEdit(null);
    setCurrentView('HOME');
  };

  const renderContent = () => {
    if (activePresentation && currentView === 'PLAYER') {
      return (
        <Player 
          presentation={activePresentation} 
          onClose={() => {
            setActivePresentation(null);
            setCurrentView('HOME');
          }} 
        />
      );
    }

    switch (currentView) {
      case 'UPLOAD':
        return (
          <Upload 
            onUploadComplete={handleUploadComplete} 
            onCancel={() => {
                setPresentationToEdit(null);
                setCurrentView('HOME');
            }} 
            initialPresentation={presentationToEdit}
          />
        );
      case 'ANALYTICS':
        return <Analytics />;
      case 'HOME':
      default:
        return (
          <main className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Discover Presentations</h1>
              <p className="text-slate-500 dark:text-slate-400">Explore the best HTML-based slide decks from the community.</p>

              <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
                {['Trending', 'Technology', 'Design', 'Business', 'Education'].map(tag => (
                   <button key={tag} className="px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-white transition-colors">
                      {tag}
                   </button>
                ))}
              </div>
            </div>

            {mainViewMode === 'cards' ? (
              <DiscoveryGrid
                presentations={presentations}
                onSelect={handlePresentationSelect}
                onEdit={handlePresentationEdit}
              />
            ) : (
              <PresentationSlidesGrid
                presentations={presentations}
                onSlideClick={handlePresentationSelect}
              />
            )}
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      {/* Do not show header in immersive player mode */}
      {currentView !== 'PLAYER' && (
        <Header
          currentView={currentView}
          setView={setCurrentView}
          theme={theme}
          toggleTheme={toggleTheme}
          mainViewMode={mainViewMode}
          toggleMainViewMode={toggleMainViewMode}
        />
      )}
      
      <div className="flex-1">
        {renderContent()}
      </div>

      {/* Footer */}
      {currentView !== 'PLAYER' && (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 mt-12 transition-colors duration-300">
            <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
                <p>&copy; 2024 SlideShare HTML. All rights reserved.</p>
                <div className="flex justify-center gap-4 mt-4">
                    <a href="#" className="hover:text-indigo-600 dark:hover:text-white">Privacy</a>
                    <a href="#" className="hover:text-indigo-600 dark:hover:text-white">Terms</a>
                    <a href="#" className="hover:text-indigo-600 dark:hover:text-white">API</a>
                </div>
            </div>
        </footer>
      )}
    </div>
  );
}