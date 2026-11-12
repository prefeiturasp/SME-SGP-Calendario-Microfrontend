import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SelectCampo } from "./SelectCampo";

const lista = [
  { valor: 1, descricao: "Sim" },
  { valor: 2, descricao: "Não" },
];

const renderizar = (props: Partial<React.ComponentProps<typeof SelectCampo>> = {}) =>
  render(
    <SelectCampo
      id="campo"
      lista={lista}
      valueOption="valor"
      valueText="descricao"
      onChange={vi.fn()}
      {...props}
    />,
  );

describe("SelectCampo", () => {
  it("não renderiza label nem erro por padrão", () => {
    const { container } = renderizar();
    expect(container.querySelector("label")).toBeNull();
    expect(container.querySelector(".campo-erro")).toBeNull();
    expect(container.querySelector(".campo-invalido")).toBeNull();
  });

  it("renderiza o label associado ao campo e o indicador de obrigatório", () => {
    const { container } = renderizar({ label: "Letivo", labelRequired: true });
    const label = container.querySelector("label") as HTMLLabelElement;
    expect(label.textContent).toBe("Letivo*");
    expect(label.htmlFor).toBe("campo");
    expect(container.querySelector(".campo-obrigatorio")).toBeTruthy();
  });

  it("não exibe o indicador de obrigatório quando não solicitado", () => {
    const { container } = renderizar({ label: "Letivo" });
    expect(container.querySelector(".campo-obrigatorio")).toBeNull();
  });

  it("exibe a mensagem de erro e marca o campo como inválido", () => {
    const { container } = renderizar({ erro: "Campo obrigatório" });
    expect(screen.getByText("Campo obrigatório").className).toBe("campo-erro");
    expect(container.querySelector(".campo-invalido")).toBeTruthy();
  });

  it("exibe o placeholder quando não há valor", () => {
    renderizar({ placeholder: "Selecione" });
    expect(screen.getByText("Selecione")).toBeTruthy();
  });

  it("exibe o texto da opção correspondente ao valor", () => {
    renderizar({ value: "2" });
    expect(screen.getByText("Não")).toBeTruthy();
  });

  it("trata valor vazio como sem seleção", () => {
    renderizar({ value: "", placeholder: "Selecione" });
    expect(screen.getByText("Selecione")).toBeTruthy();
  });

  it("converte opções para strings, usando vazio para campos ausentes", () => {
    renderizar({ lista: [{ valor: 3 }], value: "3" });
    expect(document.querySelector(".ant-select-selection-item")?.textContent).toBe("");
  });

  it("chama onChange com o valor da opção escolhida", () => {
    const onChange = vi.fn();
    const { container } = renderizar({ onChange });

    fireEvent.mouseDown(container.querySelector(".ant-select-selector") as HTMLElement);
    fireEvent.click(within(document.body).getByText("Sim"));

    expect(onChange.mock.calls[0][0]).toBe("1");
  });

  it("indica carregamento com o spinner", () => {
    const { container } = renderizar({ carregando: true });
    expect(container.querySelector(".ant-spin-spinning")).toBeTruthy();
  });

  it("desabilita o select", () => {
    const { container } = renderizar({ disabled: true });
    expect(container.querySelector(".ant-select-disabled")).toBeTruthy();
  });

  it("habilita o modo múltiplo", () => {
    const { container } = renderizar({ multiple: true });
    expect(container.querySelector(".ant-select-multiple")).toBeTruthy();
  });
});
