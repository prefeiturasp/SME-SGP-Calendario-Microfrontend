/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SGP_API?: string;
  readonly VITE_CALENDARIO_VERSAO?: string;
}

interface EnvCalendario {
  VITE_SGP_API?: string;
  VITE_CALENDARIO_VERSAO?: string;
}

declare global {
  var __ENV__: EnvCalendario | undefined;

  interface Window {
    __ENV__?: EnvCalendario;
  }
}

export {};
