
import React, { useState, useEffect } from 'react';
import { PREBUILT_VOICES, TONES } from '../types';
import { generateSpeech } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { ArrowLeftIcon, SpeakerWaveIcon } from './icons';
import { AdBanner } from './AdBanner';

interface TextEditorProps {
  initialText: string;
  onAudioReady: (audioB64: string) => void;
  onBack: () => void;
  onError: (error: string) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ initialText, onAudioReady, onBack, onError }) => {
  const [text, setText] = useState(initialText);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(PREBUILT_VOICES[0].id);
  const [selectedTone, setSelectedTone] = useState(TONES[0].value);

  useEffect(() => {
    const savedText = localStorage.getItem('lepramim_text');
    if (savedText && initialText === '') {
      setText(savedText);
    } else {
        setText(initialText);
    }
  }, [initialText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    localStorage.setItem('lepramim_text', e.target.value);
  };

  const handleListen = async () => {
    if (!text.trim()) {
      onError('Por favor, insira algum texto para ouvir.');
      return;
    }
    setIsLoading(true);
    onError('');
    try {
      const audioB64 = await generateSpeech(text, selectedVoice, selectedTone);
      onAudioReady(audioB64);
    } catch (error) {
      console.error(error);
      onError('Falha ao gerar o áudio. Verifique sua conexão ou tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full animate-fade-in flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <ArrowLeftIcon />
        </button>
        <h2 className="text-xl font-semibold">Editar Texto e Gerar Áudio</h2>
        <div className="w-8"></div>
      </div>
      
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Digite ou cole seu texto aqui..."
        className="w-full flex-grow bg-gray-900 text-gray-200 p-4 rounded-lg border-2 border-gray-700 focus:border-brand-primary focus:ring-brand-primary transition-colors resize-none min-h-[250px] sm:min-h-[300px]"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
              <label htmlFor="voice-select" className="block text-sm font-medium text-gray-300 mb-1">Voz</label>
              <select 
                id="voice-select" 
                value={selectedVoice} 
                onChange={e => setSelectedVoice(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-brand-primary focus:border-brand-primary"
              >
                  {PREBUILT_VOICES.map(voice => (
                      <option key={voice.id} value={voice.id}>{voice.name}</option>
                  ))}
              </select>
          </div>
          <div>
              <label htmlFor="tone-select" className="block text-sm font-medium text-gray-300 mb-1">Tom/Ênfase (Opcional)</label>
              <select 
                id="tone-select"
                value={selectedTone}
                onChange={e => setSelectedTone(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-brand-primary focus:border-brand-primary"
              >
                  {TONES.map(tone => (
                      <option key={tone.value} value={tone.value}>{tone.label}</option>
                  ))}
              </select>
          </div>
      </div>

      <AdBanner className="my-6" />

      <button
        onClick={handleListen}
        disabled={isLoading}
        className="w-full bg-brand-primary hover:bg-brand-secondary disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300"
      >
        {isLoading ? <LoadingSpinner /> : <SpeakerWaveIcon />}
        <span className="ml-2">{isLoading ? 'Gerando Áudio...' : 'Ouvir Texto'}</span>
      </button>
    </div>
  );
};
