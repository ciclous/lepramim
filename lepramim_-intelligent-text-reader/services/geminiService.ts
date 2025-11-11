
import { GoogleGenAI, Modality } from '@google/genai';

if (!process.env.API_KEY) {
    // In a real app, you'd want a more robust way to handle this,
    // but for this example, we'll throw an error.
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts text from a given image using Gemini.
 * @param base64Image The base64 encoded string of the image.
 * @returns A promise that resolves to the extracted text.
 */
export const extractTextFromImage = async (base64Image: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
        },
    };
    const textPart = {
        text: 'Extraia todo o texto desta imagem. Responda apenas com o texto extraído.'
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });
    
    return response.text;
};

/**
 * Generates speech from text using the Gemini TTS model.
 * @param text The text to convert to speech.
 * @param voice The desired voice for the speech.
 * @param tone An optional tone/emphasis for the speech.
 * @returns A promise that resolves to the base64 encoded audio data.
 */
export const generateSpeech = async (text: string, voice: string, tone: string): Promise<string> => {
    const prompt = tone ? `Say ${tone}: ${text}` : text;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data returned from API.");
    }
    return base64Audio;
};
