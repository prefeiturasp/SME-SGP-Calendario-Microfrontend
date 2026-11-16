import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CampoTexto, type TFormulario } from "./CampoTexto";

const criarForm = (sobrescrever: Partial<Record<string, unknown>> = {}) =>
  ({
    values: { nome: "abc" },
    touched: {},
    errors: {},
    setFieldValue: vi.fn(),
    setFieldTouched: vi.fn(),
    ...sobrescrever,
  }) as unknown as TFormulario;

describe("CampoTexto", () => {
  it("renderiza label, valor, placeholder e rows padrão", () => {
    render(
      <CampoTexto form={criarForm()} name="nome" label="Nome" placeholder="Digite" maxlength={10} />,
    );
    const campo = screen.getByLabelText("Nome") as HTMLTextAreaElement;
    expect(campo.value).toBe("abc");
    expect(campo.placeholder).toBe("Digite");
    expect(campo.rows).toBe(3);
    expect(campo.style.resize).toBe("none");
  });

  it("respeita rows, id, desabilitado e labelRequired", () => {
    render(
      <CampoTexto form={criarForm()} name="nome" id="outro" label="Nome" rows={1} desabilitado labelRequired />,
    );
    const campo = screen.getByLabelText(/Nome/) as HTMLTextAreaElement;
    expect(campo.id).toBe("outro");
    expect(campo.rows).toBe(1);
    expect(campo.disabled).toBe(true);
    expect(screen.getByText("*")).toBeTruthy();
  });

  it("exibe string vazia quando o valor não existe", () => {
    render(<CampoTexto form={criarForm({ values: {} })} name="nome" label="Nome" />);
    expect((screen.getByLabelText("Nome") as HTMLTextAreaElement).value).toBe("");
  });

  it("atualiza o formulário e chama onChange com o texto digitado", () => {
    const form = criarForm();
    const onChange = vi.fn();
    render(<CampoTexto form={form} name="nome" label="Nome" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "novo" } });
    expect(form.setFieldValue).toHaveBeenCalledWith("nome", "novo");
    expect(form.setFieldTouched).toHaveBeenCalledWith("nome", true, false);
    expect(onChange).toHaveBeenCalledWith("novo");
  });

  it("não falha sem onChange", () => {
    const form = criarForm();
    render(<CampoTexto form={form} name="nome" label="Nome" />);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "x" } });
    expect(form.setFieldValue).toHaveBeenCalledWith("nome", "x");
  });

  it("mostra o erro somente quando o campo foi tocado", () => {
    const { rerender } = render(
      <CampoTexto form={criarForm({ errors: { nome: "Obrigatório" } })} name="nome" label="Nome" />,
    );
    expect(screen.queryByText("Obrigatório")).toBeNull();

    rerender(
      <CampoTexto
        form={criarForm({ errors: { nome: "Obrigatório" }, touched: { nome: true } })}
        name="nome"
        label="Nome"
      />,
    );
    expect(screen.getByText("Obrigatório")).toBeTruthy();
    expect(document.querySelector(".campo-invalido")).not.toBeNull();
  });
});
