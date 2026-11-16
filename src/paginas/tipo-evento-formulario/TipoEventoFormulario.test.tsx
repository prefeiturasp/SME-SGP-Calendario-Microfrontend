import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROTAS } from "~/core/constantes";
import { createMockStore } from "~/mocks/mockStore";

const mocks = vi.hoisted(() => ({
  confirmar: vi.fn(),
  sucesso: vi.fn(),
  definirBreadcrumbManual: vi.fn(),
}));

vi.mock("~/core/config/alertas", () => ({
  confirmar: mocks.confirmar,
  sucesso: mocks.sucesso,
}));

vi.mock("~/core/sessao", () => ({
  definirBreadcrumbManual: mocks.definirBreadcrumbManual,
}));

vi.mock("~/mocks/mockTipoEventos", () => ({
  mockTipoEventos: [
    {
      id: 1,
      descricao: "Reunião",
      letivo: 1,
      localOcorrencia: 2,
      concomitancia: false,
      tipoData: 2,
      dependencia: false,
      ativo: false,
      criadoPor: "Fulano",
      criadoRF: "123",
      criadoEm: "2026-11-06T15:15:06",
    },
  ],
}));

vi.mock("~/componentes/ui/SelectCampo", () => ({
  SelectCampo: ({
    id,
    label,
    lista,
    value,
    valueOption,
    valueText,
    disabled,
    onChange,
  }: {
    id: string;
    label?: string;
    lista: Record<string, unknown>[];
    value?: string;
    valueOption: string;
    valueText: string;
    disabled?: boolean;
    onChange: (valor: string) => void;
  }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value || ""}
        disabled={disabled}
        onChange={(evento) => onChange(evento.target.value)}
      >
        <option value="" />
        {lista.map((item) => (
          <option key={String(item[valueOption])} value={String(item[valueOption])}>
            {String(item[valueText])}
          </option>
        ))}
      </select>
    </div>
  ),
}));

import { TipoEventosFormulario } from "./TipoEventoFormulario";

const LocalizacaoAtual = () => <output data-testid="local">{useLocation().pathname}</output>;

const renderizar = (rota: string) =>
  render(
    <Provider store={createMockStore()}>
      <MemoryRouter initialEntries={[rota]}>
        <Routes>
          <Route path={`${ROTAS.TIPO_EVENTOS}/novo`} element={<TipoEventosFormulario />} />
          <Route path={`${ROTAS.TIPO_EVENTOS}/editar/:id`} element={<TipoEventosFormulario />} />
          <Route path="*" element={null} />
        </Routes>
        <LocalizacaoAtual />
      </MemoryRouter>
    </Provider>,
  );

const botao = (id: string) => document.getElementById(id) as HTMLButtonElement;
const local = () => screen.getByTestId("local").textContent;
const preencherCadastro = () => {
  fireEvent.change(screen.getByLabelText(/Nome do tipo de evento/), { target: { value: "Novo" } });
  fireEvent.change(screen.getByLabelText(/Local de ocorrência/), { target: { value: "3" } });
  fireEvent.change(screen.getByLabelText(/Letivo/), { target: { value: "2" } });
};

describe("TipoEventosFormulario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirmar.mockResolvedValue(true);
  });

  describe("cadastro", () => {
    const rota = `${ROTAS.TIPO_EVENTOS}/novo`;

    it("exibe título, valores padrão e botões no estado inicial", () => {
      renderizar(rota);
      expect(screen.getByRole("heading", { name: "Cadastro de Tipo de Eventos" })).toBeTruthy();
      expect(botao("SGP_BUTTON_ALTERAR_CADASTRAR").textContent).toBe("Cadastrar");
      expect(botao("SGP_BUTTON_ALTERAR_CADASTRAR").disabled).toBe(false);
      expect(botao("SGP_BUTTON_CANCELAR").disabled).toBe(true);
      expect(botao("SGP_BUTTON_EXCLUIR").disabled).toBe(true);
      expect((screen.getAllByRole("radio", { name: "Sim" })[0] as HTMLInputElement).checked).toBe(true);
      expect((screen.getByRole("radio", { name: "Única" }) as HTMLInputElement).checked).toBe(true);
      expect((screen.getByRole("radio", { name: "Ativo" }) as HTMLInputElement).checked).toBe(true);
      expect(mocks.definirBreadcrumbManual).not.toHaveBeenCalled();
    });

    it("exibe mensagens de validação ao cadastrar sem preencher", async () => {
      renderizar(rota);
      fireEvent.click(botao("SGP_BUTTON_ALTERAR_CADASTRAR"));
      expect(await screen.findByText("Digite o nome do tipo de evento")).toBeTruthy();
      expect(mocks.sucesso).not.toHaveBeenCalled();
      expect(local()).toBe(rota);
    });

    it("cadastra com sucesso e volta para a listagem", async () => {
      renderizar(rota);
      preencherCadastro();
      fireEvent.click(botao("SGP_BUTTON_ALTERAR_CADASTRAR"));
      await waitFor(() =>
        expect(mocks.sucesso).toHaveBeenCalledWith("Tipo de evento cadastrado com sucesso!"),
      );
      expect(local()).toBe(ROTAS.TIPO_EVENTOS);
    });

    it("habilita o cancelar ao editar e restaura os valores ao confirmar", async () => {
      renderizar(rota);
      preencherCadastro();
      fireEvent.click(screen.getByRole("radio", { name: "Início e fim" }));
      expect(botao("SGP_BUTTON_CANCELAR").disabled).toBe(false);

      fireEvent.click(botao("SGP_BUTTON_CANCELAR"));
      await waitFor(() => expect(botao("SGP_BUTTON_CANCELAR").disabled).toBe(true));
      expect((screen.getByLabelText(/Nome do tipo de evento/) as HTMLTextAreaElement).value).toBe("");
      expect((screen.getByRole("radio", { name: "Única" }) as HTMLInputElement).checked).toBe(true);
    });

    it("mantém os dados quando o cancelamento não é confirmado", async () => {
      mocks.confirmar.mockResolvedValue(false);
      renderizar(rota);
      preencherCadastro();
      fireEvent.click(botao("SGP_BUTTON_CANCELAR"));
      await waitFor(() => expect(mocks.confirmar).toHaveBeenCalled());
      expect((screen.getByLabelText(/Nome do tipo de evento/) as HTMLTextAreaElement).value).toBe("Novo");
      expect(botao("SGP_BUTTON_CANCELAR").disabled).toBe(false);
    });

    it("volta direto para a listagem sem alterações", async () => {
      renderizar(rota);
      fireEvent.click(botao("SGP_BUTTON_VOLTAR"));
      await waitFor(() => expect(local()).toBe(ROTAS.TIPO_EVENTOS));
      expect(mocks.confirmar).not.toHaveBeenCalled();
    });

    it("com alterações, voltar e recusar salvar navega sem cadastrar", async () => {
      mocks.confirmar.mockResolvedValue(false);
      renderizar(rota);
      preencherCadastro();
      fireEvent.click(botao("SGP_BUTTON_VOLTAR"));
      await waitFor(() => expect(local()).toBe(ROTAS.TIPO_EVENTOS));
      expect(mocks.sucesso).not.toHaveBeenCalled();
    });

    it("com alterações, voltar e aceitar salvar cadastra", async () => {
      mocks.confirmar.mockResolvedValue(true);
      renderizar(rota);
      preencherCadastro();
      fireEvent.click(botao("SGP_BUTTON_VOLTAR"));
      await waitFor(() =>
        expect(mocks.sucesso).toHaveBeenCalledWith("Tipo de evento cadastrado com sucesso!"),
      );
    });
  });

  describe("edição", () => {
    const rota = `${ROTAS.TIPO_EVENTOS}/editar/1`;

    it("carrega os dados do tipo de evento, auditoria e breadcrumb", async () => {
      renderizar(rota);
      expect(screen.getByRole("heading", { name: "Alteração de Tipo de Eventos" })).toBeTruthy();
      await waitFor(() =>
        expect((screen.getByLabelText(/Nome do tipo de evento/) as HTMLTextAreaElement).value).toBe(
          "Reunião",
        ),
      );
      expect((screen.getByLabelText(/Local de ocorrência/) as HTMLSelectElement).value).toBe("2");
      expect((screen.getByLabelText(/Letivo/) as HTMLSelectElement).value).toBe("1");
      expect((screen.getByRole("radio", { name: "Início e fim" }) as HTMLInputElement).checked).toBe(true);
      expect((screen.getByRole("radio", { name: "Inativo" }) as HTMLInputElement).checked).toBe(true);
      expect(mocks.definirBreadcrumbManual).toHaveBeenCalledWith(
        rota,
        "Alteração de Tipo de Eventos",
        ROTAS.TIPO_EVENTOS,
      );
      expect(botao("SGP_BUTTON_ALTERAR_CADASTRAR").textContent).toBe("Alterar");
      expect(botao("SGP_BUTTON_ALTERAR_CADASTRAR").disabled).toBe(true);
      expect(botao("SGP_BUTTON_EXCLUIR").disabled).toBe(false);
    });

    it("redireciona para a listagem quando o id não existe", async () => {
      renderizar(`${ROTAS.TIPO_EVENTOS}/editar/999`);
      await waitFor(() => expect(local()).toBe(ROTAS.TIPO_EVENTOS));
    });

    it("habilita o alterar após modificar e atualiza com sucesso", async () => {
      renderizar(rota);
      await waitFor(() => expect(botao("SGP_BUTTON_EXCLUIR").disabled).toBe(false));
      fireEvent.change(screen.getByLabelText(/Nome do tipo de evento/), {
        target: { value: "Reunião 2" },
      });
      expect(botao("SGP_BUTTON_ALTERAR_CADASTRAR").disabled).toBe(false);
      fireEvent.click(botao("SGP_BUTTON_ALTERAR_CADASTRAR"));
      await waitFor(() =>
        expect(mocks.sucesso).toHaveBeenCalledWith("Tipo de evento atualizado com sucesso!"),
      );
      expect(local()).toBe(ROTAS.TIPO_EVENTOS);
    });

    it("restaura os valores originais ao cancelar", async () => {
      renderizar(rota);
      await waitFor(() => expect(botao("SGP_BUTTON_EXCLUIR").disabled).toBe(false));
      fireEvent.change(screen.getByLabelText(/Nome do tipo de evento/), { target: { value: "Outro" } });
      fireEvent.click(botao("SGP_BUTTON_CANCELAR"));
      await waitFor(() =>
        expect((screen.getByLabelText(/Nome do tipo de evento/) as HTMLTextAreaElement).value).toBe(
          "Reunião",
        ),
      );
      expect(botao("SGP_BUTTON_CANCELAR").disabled).toBe(true);
    });

    it("exclui após confirmação", async () => {
      renderizar(rota);
      await waitFor(() => expect(botao("SGP_BUTTON_EXCLUIR").disabled).toBe(false));
      fireEvent.click(botao("SGP_BUTTON_EXCLUIR"));
      await waitFor(() =>
        expect(mocks.sucesso).toHaveBeenCalledWith("Tipo de evento deletado com sucesso!"),
      );
      expect(local()).toBe(ROTAS.TIPO_EVENTOS);
    });

    it("não exclui quando a confirmação é recusada", async () => {
      mocks.confirmar.mockResolvedValue(false);
      renderizar(rota);
      await waitFor(() => expect(botao("SGP_BUTTON_EXCLUIR").disabled).toBe(false));
      fireEvent.click(botao("SGP_BUTTON_EXCLUIR"));
      await waitFor(() => expect(mocks.confirmar).toHaveBeenCalled());
      expect(mocks.sucesso).not.toHaveBeenCalled();
      expect(local()).toBe(rota);
    });
  });
});
