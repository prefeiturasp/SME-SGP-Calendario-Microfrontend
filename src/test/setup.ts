import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import "../core/datas";

// JSDOM não implementa a consulta de pseudoelementos usada pelo Ant Design.
const calcularEstilo = window.getComputedStyle.bind(window);
window.getComputedStyle = (elemento) => calcularEstilo(elemento);

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

afterEach(() => {
  cleanup();
});
