
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { decode, decodeAudioData } from '../services/audioService';
import { generateSpeech } from '../services/geminiService';
import { PREBUILT_VOICES, PLAYBACK_RATES, TONES } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ArrowLeftIcon, PlayIcon, PauseIcon, ForwardIcon, BackwardIcon } from './icons';
import { AdBanner } from './AdBanner';

interface PlayerProps {
  text: string;
  audioB64: string;
  onBack: () => void;
  onError: (error: string) => void;
}

export const Player: React.FC<PlayerProps> = ({ text, audioB64, onBack, onError }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Settings
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [currentAudioB64, setCurrentAudioB64] = useState(audioB64);
  const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem('lepramim_voice') || PREBUILT_VOICES[0].id);
  const [selectedTone, setSelectedTone] = useState(() => localStorage.getItem('lepramim_tone') || TONES[0].value);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef(0);
  const startOffsetRef = useRef(0);
  const animationFrameRef = useRef<number>();

  const updateProgress = useCallback(() => {
    if (audioContextRef.current && audioBufferRef.current && isPlaying) {
      const elapsedTime = audioContextRef.current.currentTime - startTimeRef.current + startOffsetRef.current;
      setCurrentTime(elapsedTime);
      setProgress((elapsedTime / audioBufferRef.current.duration) * 100);

      if (elapsedTime >= audioBufferRef.current.duration) {
        setIsPlaying(false);
        setProgress(100);
        setCurrentTime(duration);
      } else {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    }
  }, [isPlaying, duration]);

  const stopPlayback = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current!);
    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null;
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
  }, []);

  const playAudio = useCallback((offset = 0) => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    
    stopPlayback();

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = playbackRate;
    source.connect(gainNodeRef.current!);

    startOffsetRef.current = offset;
    startTimeRef.current = audioContextRef.current.currentTime;
    
    source.start(0, offset);
    source.onended = () => {
      if (progress < 99) { // Avoid state change if stopped manually
         setIsPlaying(false);
      }
    };

    sourceNodeRef.current = source;
    setIsPlaying(true);
    animationFrameRef.current = requestAnimationFrame(updateProgress);

  }, [playbackRate, stopPlayback, updateProgress, progress]);

  const loadAudio = useCallback(async (b64: string) => {
    setIsLoading(true);
    onError('');
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
      }
      
      const audioBytes = decode(b64);
      const buffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
      audioBufferRef.current = buffer;
      setDuration(buffer.duration);
      setCurrentTime(0);
      setProgress(0);
      playAudio();

    } catch (e) {
      console.error(e);
      onError('Erro ao decodificar áudio. Tente gerar novamente.');
    } finally {
        setIsLoading(false);
    }
  }, [onError, playAudio]);

  useEffect(() => {
    loadAudio(currentAudioB64);
    
    return () => {
      stopPlayback();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAudioB64]);
  
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
    localStorage.setItem('lepramim_volume', String(volume));
  }, [volume]);
  
  useEffect(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = playbackRate;
    }
    localStorage.setItem('lepramim_speed', String(playbackRate));
  }, [playbackRate]);

  useEffect(() => {
    localStorage.setItem('lepramim_voice', selectedVoice);
    localStorage.setItem('lepramim_tone', selectedTone);
  }, [selectedVoice, selectedTone]);


  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      startOffsetRef.current += audioContextRef.current!.currentTime - startTimeRef.current;
      stopPlayback();
    } else {
        if(progress >= 100){
            playAudio(0);
        } else {
            playAudio(startOffsetRef.current);
        }
    }
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    const newTime = (newProgress / 100) * duration;
    setCurrentTime(newTime);
    if(isPlaying) {
      playAudio(newTime);
    } else {
      startOffsetRef.current = newTime;
    }
  };

  const skipTime = (amount: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + amount));
    setCurrentTime(newTime);
    setProgress((newTime / duration) * 100);
    if(isPlaying) {
      playAudio(newTime);
    } else {
      startOffsetRef.current = newTime;
    }
  };

  const handleRegenerateAudio = async () => {
    setIsLoading(true);
    stopPlayback();
    try {
        const newAudioB64 = await generateSpeech(text, selectedVoice, selectedTone);
        setCurrentAudioB64(newAudioB64);
        // loadAudio will be triggered by useEffect on currentAudioB64 change
    } catch(e) {
        console.error(e);
        onError('Falha ao regenerar o áudio.');
        setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-2xl w-full animate-fade-in flex flex-col">
        <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                <ArrowLeftIcon />
            </button>
            <h2 className="text-xl font-semibold text-center">Reprodução</h2>
            <div className="w-8"></div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
            <p className="text-gray-300">{text}</p>
        </div>

        {/* Player controls */}
        <div className="bg-gray-700/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <span>{formatTime(currentTime)}</span>
                <input type="range" min="0" max="100" value={progress} onChange={handleSeek} disabled={isLoading} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-primary" />
                <span>{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-center gap-4 my-4">
                <button onClick={() => skipTime(-10)} disabled={isLoading} className="p-3 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"><BackwardIcon /></button>
                <button onClick={handlePlayPause} disabled={isLoading} className="bg-brand-primary text-white p-4 rounded-full hover:bg-brand-secondary transition-transform transform hover:scale-105 disabled:bg-gray-600">
                    {isLoading ? <LoadingSpinner /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button onClick={() => skipTime(10)} disabled={isLoading} className="p-3 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"><ForwardIcon /></button>
            </div>
        </div>

        {/* Personalization */}
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-center">Personalização</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor="voice-select" className="block text-sm font-medium text-gray-300 mb-1">Voz</label>
                    <select id="voice-select" value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-brand-primary focus:border-brand-primary">
                        {PREBUILT_VOICES.map(voice => <option key={voice.id} value={voice.id}>{voice.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="tone-select" className="block text-sm font-medium text-gray-300 mb-1">Tom/Ênfase</label>
                    <select id="tone-select" value={selectedTone} onChange={e => setSelectedTone(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-brand-primary focus:border-brand-primary">
                        {TONES.map(tone => <option key={tone.value} value={tone.value}>{tone.label}</option>)}
                    </select>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <button onClick={handleRegenerateAudio} disabled={isLoading} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition-colors disabled:bg-gray-600">
                    {isLoading ? 'Aplicando...' : 'Aplicar Voz e Tom'}
                  </button>
                </div>

                <div className="mt-2">
                    <label htmlFor="speed-select" className="block text-sm font-medium text-gray-300 mb-1">Velocidade: {playbackRate.toFixed(2)}x</label>
                    <div className="flex gap-2">
                         {PLAYBACK_RATES.map(rate => (
                            <button key={rate.value} onClick={() => setPlaybackRate(rate.value)} className={`flex-1 text-xs py-1 px-2 rounded ${playbackRate === rate.value ? 'bg-brand-primary text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                {rate.label}
                            </button>
                         ))}
                    </div>
                </div>

                <div className="mt-2">
                    <label htmlFor="volume-slider" className="block text-sm font-medium text-gray-300 mb-1">Volume: {Math.round(volume * 100)}%</label>
                    <input id="volume-slider" type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-primary" />
                </div>
            </div>
        </div>

        {/* Ad Monetization Placeholder */}
        <AdBanner className="mt-8" />
    </div>
  );
};
