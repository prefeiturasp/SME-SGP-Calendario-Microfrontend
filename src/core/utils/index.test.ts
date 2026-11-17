import { describe, expect, it } from "vitest";
import { textoDoCampo } from "./index";

describe("textoDoCampo", () => {
  it("devolve a própria string", () => {
    expect(textoDoCampo("abc")).toBe("abc");
  });

  it("preserva string vazia", () => {
    expect(textoDoCampo("")).toBe("");
  });

  it("converte número em texto", () => {
    expect(textoDoCampo(5)).toBe("5");
    expect(textoDoCampo(0)).toBe("0");
  });

  it("devolve vazio para undefined e null", () => {
    expect(textoDoCampo(undefined)).toBe("");
    expect(textoDoCampo(null)).toBe("");
  });

  it("devolve vazio para objeto e array, sem gerar [object Object]", () => {
    expect(textoDoCampo({})).toBe("");
    expect(textoDoCampo([1, 2])).toBe("");
  });

  it("devolve vazio para booleano", () => {
    expect(textoDoCampo(true)).toBe("");
  });
});