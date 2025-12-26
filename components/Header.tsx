import React from 'react';
import { Layers, Upload, BarChart2, User, Search, Play, Sun, Moon, LayoutGrid, LayoutList } from 'lucide-react';
import { ViewState } from '../types';

interface HeaderProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  mainViewMode?: 'cards' | 'slideGrid';
  toggleMainViewMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setView,
  theme,
  toggleTheme,
  mainViewMode = 'cards',
  toggleMainViewMode
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60 transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-500 cursor-pointer hover:text-indigo-500 dark:hover:text-indigo-400 transition"
          onClick={() => setView('HOME')}
        >
          <Layers className="h-6 w-6" />
          <span>SlideShare<span className="text-slate-900 dark:text-white">HTML</span></span>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search presentations..." 
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500 transition-colors"
          />
        </div>

        <nav className="flex items-center gap-2">
          <button 
            onClick={() => setView('HOME')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'HOME' ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-slate-800' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            Discovery
          </button>
          <button 
            onClick={() => setView('ANALYTICS')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'ANALYTICS' ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-slate-800' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <BarChart2 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>

          {/* View Mode Toggle - Only show on HOME view */}
          {currentView === 'HOME' && toggleMainViewMode && (
            <button
              onClick={toggleMainViewMode}
              className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white transition-colors"
              title={mainViewMode === 'cards' ? 'Switch to Slide Grid View' : 'Switch to Card View'}
            >
              {mainViewMode === 'cards' ? (
                <LayoutGrid className="h-4 w-4" />
              ) : (
                <LayoutList className="h-4 w-4" />
              )}
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          
          <button 
            onClick={() => setView('UPLOAD')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors ml-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </button>
          
          <div className="ml-2 w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center cursor-pointer shadow-md">
            <User className="h-4 w-4 text-white" />
          </div>
        </nav>
      </div>
    </header>
  );
};