/// <reference types="vite/client" />

export {};

declare global {
  interface Window {
    umami?: {
      track: (event: string | object | ((props: any) => object), data?: object) => void;
    };
  }
}
