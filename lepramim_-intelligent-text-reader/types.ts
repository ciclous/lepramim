
export enum View {
  SOURCE_SELECTION,
  TEXT_EDITOR,
  PLAYER,
}

export interface AppState {
  view: View;
  text: string;
  audioB64: string | null;
  error: string | null;
}

export const PREBUILT_VOICES = [
    { id: 'Kore', name: 'Kore (Feminino)' },
    { id: 'Puck', name: 'Puck (Masculino)' },
    { id: 'Zephyr', name: 'Zephyr (Feminino, Suave)' },
    { id: 'Charon', name: 'Charon (Masculino, Profundo)' },
    { id: 'Fenrir', name: 'Fenrir (Masculino)' },
];

export const PLAYBACK_RATES = [
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1.0, label: '1.0x' },
    { value: 1.5, label: '1.5x' },
    { value: 2.0, label: '2.0x' },
];

export const TONES = [
    { value: '', label: 'Nenhum' },
    { value: 'cheerfully', label: 'Alegre' },
    { value: 'sadly', label: 'Triste' },
    { value: 'informatively', label: 'Informativo' },
    { value: 'excitedly', label: 'Empolgado' },
];
