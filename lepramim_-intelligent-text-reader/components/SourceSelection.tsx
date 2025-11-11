import React, { useState, useRef } from 'react';
import { extractTextFromImage } from '../services/geminiService';
import { CameraIcon, ClipboardIcon, ArrowUpOnSquareIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';

// Since pdf.js is loaded via a script tag, we need to tell TypeScript about its global variable on the window object.
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface SourceSelectionProps {
  onTextReady: (text: string) => void;
  onError: (error: string) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

export const SourceSelection: React.FC<SourceSelectionProps> = ({ onTextReady, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    onError('');
    try {
      const base64Image = await fileToBase64(file);
      const extractedText = await extractTextFromImage(base64Image);
      onTextReady(extractedText);
    } catch (error) {
      console.error(error);
      onError('Falha ao extrair texto da imagem. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
      // Reset input value to allow uploading the same file again
      if(imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    onError('');
    try {
        let text = '';
        const fileType = file.name.split('.').pop()?.toLowerCase();

        if (fileType === 'txt') {
            text = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = () => reject(new Error('Falha ao ler o arquivo de texto.'));
                reader.readAsText(file, 'UTF-8');
            });
        } else if (fileType === 'pdf') {
            if (typeof window.pdfjsLib === 'undefined') {
                throw new Error('A biblioteca PDF não foi carregada. Verifique sua conexão com a internet.');
            }
            // Use the library from the window object.
            const pdfjsLib = window.pdfjsLib;
            
            // Configure the worker to avoid issues with script loading order.
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.178/pdf.worker.min.js`;

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const textPromises = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                textPromises.push(page.getTextContent());
            }
            const textContents = await Promise.all(textPromises);
            text = textContents.map(content =>
                content.items.map((item: any) => item.str).join(' ')
            ).join('\n\n');
        } else if (fileType === 'epub') {
            throw new Error('A extração de texto de arquivos .epub ainda não é suportada.');
        } else {
            throw new Error(`Tipo de arquivo não suportado: .${fileType}`);
        }

        onTextReady(text);
    } catch (error: any) {
        console.error(error);
        onError(error.message || 'Falha ao processar o arquivo.');
    } finally {
        setIsLoading(false);
        if(docInputRef.current) docInputRef.current.value = "";
    }
  };
  
  const handlePasteText = () => {
    onTextReady('');
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-xl h-64">
            <LoadingSpinner />
            <p className="mt-4 text-gray-300">Processando seu documento...</p>
        </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl animate-fade-in">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-100">Como você quer começar?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OptionButton icon={<ClipboardIcon />} title="Colar Texto" description="Cole o texto de sua área de transferência." onClick={handlePasteText} />
            <OptionButton icon={<ArrowUpOnSquareIcon />} title="Carregar Documento" description="Envie um arquivo .txt, .pdf ou .epub." onClick={() => docInputRef.current?.click()} />
            <OptionButton icon={<CameraIcon />} title="Extrair de Imagem" description="Use uma foto para extrair o texto com OCR." onClick={() => imageInputRef.current?.click()} />

            <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <input type="file" ref={docInputRef} onChange={handleDocumentUpload} accept=".txt,.pdf,.epub" className="hidden" />
        </div>
    </div>
  );
};

interface OptionButtonProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}

const OptionButton: React.FC<OptionButtonProps> = ({ icon, title, description, onClick }) => (
    <button onClick={onClick} className="bg-gray-700 hover:bg-brand-secondary transition-all duration-300 p-6 rounded-lg text-left flex flex-col items-center text-center group">
        <div className="w-12 h-12 text-indigo-400 group-hover:text-white transition-colors duration-300 mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-300 mt-1">{description}</p>
    </button>
);