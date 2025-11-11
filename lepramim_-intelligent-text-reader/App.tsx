
import React, { useState, useCallback } from 'react';
import { SourceSelection } from './components/SourceSelection';
import { TextEditor } from './components/TextEditor';
import { Player } from './components/Player';
import { AppState, View } from './types';
import { AdBanner } from './components/AdBanner';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    view: View.SOURCE_SELECTION,
    text: '',
    audioB64: null,
    error: null,
  });

  const handleTextReady = useCallback((text: string) => {
    setAppState(prevState => ({ ...prevState, text, view: View.TEXT_EDITOR, error: null }));
  }, []);

  const handleAudioReady = useCallback((audioB64: string) => {
    setAppState(prevState => ({ ...prevState, audioB64, view: View.PLAYER, error: null }));
  }, []);

  const handleBack = useCallback(() => {
    setAppState(prevState => {
      switch (prevState.view) {
        case View.PLAYER:
          return { ...prevState, view: View.TEXT_EDITOR, audioB64: null };
        case View.TEXT_EDITOR:
          return { ...prevState, view: View.SOURCE_SELECTION, text: '' };
        default:
          return prevState;
      }
    });
  }, []);

  const handleError = useCallback((error: string) => {
    setAppState(prevState => ({ ...prevState, error }));
  }, []);

  const renderView = () => {
    switch (appState.view) {
      case View.SOURCE_SELECTION:
        return <SourceSelection onTextReady={handleTextReady} onError={handleError} />;
      case View.TEXT_EDITOR:
        return <TextEditor initialText={appState.text} onAudioReady={handleAudioReady} onBack={handleBack} onError={handleError} />;
      case View.PLAYER:
        if (appState.audioB64) {
          return <Player text={appState.text} audioB64={appState.audioB64} onBack={handleBack} onError={handleError}/>;
        }
        // Fallback if audio is not ready
        handleBack(); 
        return null;
      default:
        return <SourceSelection onTextReady={handleTextReady} onError={handleError}/>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl mb-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
          Lepramim
        </h1>
        <p className="text-gray-300 mt-2">Seu Leitor de Texto Inteligente</p>
      </header>
      
      <div className="w-full max-w-4xl">
        <AdBanner className="mb-6" />
      </div>
      
      <main className="w-full max-w-4xl flex-grow">
        {appState.error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-4 text-center">
                <strong>Erro:</strong> {appState.error}
            </div>
        )}
        {renderView()}
      </main>
    </div>
  );
};

export default App;
