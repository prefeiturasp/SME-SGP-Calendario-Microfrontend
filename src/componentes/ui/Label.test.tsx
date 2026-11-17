import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./Label";

describe("Label", () => {
  it("renderiza um label associado ao controle", () => {
    render(<Label text="Nome" control="campo" />);
    const label = screen.getByText("Nome");
    expect(label.tagName).toBe("LABEL");
    expect(label.getAttribute("for")).toBe("campo");
    expect(screen.queryByText("*")).toBeNull();
  });

  it("exibe o asterisco quando obrigatório, com deslocamento", () => {
    render(<Label text="Nome" control="campo" isRequired requiredOffset={6} />);
    const asterisco = screen.getByText("*");
    expect(asterisco.style.marginLeft).toBe("6px");
    expect(asterisco.style.marginRight).toBe("4px");
  });

  it("exibe observação e marcador de opcional", () => {
    render(
      <Label text="Nome" control="campo" observacaoText="(max 10)" withCampoOpcional className="x" />,
    );
    expect(screen.getByText("(max 10)")).toBeTruthy();
    const opcional = screen.getByText("(opcional)");
    expect(opcional.className).toBe("campoOpcional");
    expect(opcional.getAttribute("for")).toBe("campo");
    expect(screen.getByText("Nome").className).toBe("x");
  });

  it("usa div em vez de label quando withDiv", () => {
    render(<Label text="Nome" control="campo" withDiv withCampoOpcional observacaoText="obs" />);
    expect(screen.getByText(/Nome/).tagName).toBe("DIV");
    expect(screen.getByText("(opcional)").tagName).toBe("SPAN");
    expect(document.querySelector("label")).toBeNull();
  });

  it("aplica centralização e estilos de fonte/altura", () => {
    const { container } = render(
      <Label text="Nome" control="campo" center tamanhoFonte="20" altura="30" />,
    );
    const raiz = container.firstElementChild as HTMLElement;
    expect(raiz.className).toBe("text-center");
    expect(raiz.style.fontSize).toBe("20px");
    expect(raiz.style.minHeight).toBe("30px");
  });

  it("usa fonte e altura padrão", () => {
    const { container } = render(<Label text="Nome" control="campo" />);
    const raiz = container.firstElementChild as HTMLElement;
    expect(raiz.className).toBe("");
    expect(raiz.style.fontSize).toBe("14px");
    expect(raiz.style.minHeight).toBe("17px");
  });
});
