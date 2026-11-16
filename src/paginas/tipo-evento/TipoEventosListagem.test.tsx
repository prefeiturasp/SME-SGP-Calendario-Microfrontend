import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROTAS, type PermissoesTela } from "~/core/constantes";
import { createMockStore } from "~/mocks/mockStore";

const mocks = vi.hoisted(() => ({
  confirmar: vi.fn(),
  sucesso: vi.fn(),
  exibirErrosApi: vi.fn(),
}));

vi.mock("~/core/config/alertas", () => ({
  confirmar: mocks.confirmar,
  sucesso: mocks.sucesso,
  exibirErrosApi: mocks.exibirErrosApi,
}));

vi.mock("~/mocks/mockTipoEventos", () => ({
  mockTipoEventos: [
    { id: 1, descricao: "Reunião", letivo: 1, localOcorrencia: 2 },
    { id: 2, descricao: "Prova", letivo: 2, localOcorrencia: 3 },
    { id: 3, descricao: "Feriado", letivo: 3, localOcorrencia: 5 },
  ],
}));

import { TipoEventosListagem } from "./TipoEventosListagem";

const ESPERA = { timeout: 4000 };

const permissoesCompletas: PermissoesTela = {
  podeConsultar: true,
  podeIncluir: true,
  podeAlterar: true,
  podeExcluir: true,
};

const LocalizacaoAtual = () => <output data-testid="local">{useLocation().pathname}</output>;

const renderizar = (permissoes: PermissoesTela = permissoesCompletas) => {
  const store = createMockStore({
    usuario: { logado: true, permissoes: { [ROTAS.TIPO_EVENTOS]: permissoes } },
    navegacao: { rotaAtiva: ROTAS.TIPO_EVENTOS },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[ROTAS.TIPO_EVENTOS]}>
        <TipoEventosListagem />
        <LocalizacaoAtual />
      </MemoryRouter>
    </Provider>,
  );
};

const botao = (id: string) => document.getElementById(id) as HTMLButtonElement;
const checkboxDe = (texto: string) =>
  screen.getByText(texto).closest("tr")?.querySelector("input[type=checkbox]") as HTMLElement;

describe("TipoEventosListagem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirmar.mockResolvedValue(true);
  });

  it("exibe o título, as colunas e os tipos de evento com descrições traduzidas", async () => {
    renderizar();

    expect(screen.getByRole("heading", { name: "Tipo de eventos" })).toBeTruthy();
    expect(await screen.findByText("Reunião", {}, ESPERA)).toBeTruthy();
    expect(screen.getByText("Tipo de Evento")).toBeTruthy();
    expect(screen.getByText("Local de ocorrência", { selector: "th" })).toBeTruthy();

    const linha = screen.getByText("Reunião").closest("tr") as HTMLElement;
    expect(linha.textContent).toContain("DRE");
    expect(linha.textContent).toContain("Sim");
    expect((screen.getByText("Prova").closest("tr") as HTMLElement).textContent).toContain("SME");
    expect((screen.getByText("Feriado").closest("tr") as HTMLElement).textContent).toContain("Todos");
    expect((screen.getByText("Feriado").closest("tr") as HTMLElement).textContent).toContain("Opcional");
  });

  it("navega ao voltar, criar novo e editar", async () => {
    renderizar();
    await screen.findByText("Reunião", {}, ESPERA);

    fireEvent.click(botao("SGP_BUTTON_NOVO"));
    expect(screen.getByTestId("local").textContent).toBe(`${ROTAS.TIPO_EVENTOS}/novo`);

    fireEvent.click(botao("SGP_BUTTON_VOLTAR"));
    expect(screen.getByTestId("local").textContent).toBe("/");

    fireEvent.click(screen.getByText("Prova"));
    expect(screen.getByTestId("local").textContent).toBe(`${ROTAS.TIPO_EVENTOS}/editar/2`);
  });

  it("sem permissões de inclusão/alteração/exclusão, desabilita ações e não navega", async () => {
    renderizar({ podeConsultar: true });
    await screen.findByText("Reunião", {}, ESPERA);

    expect(botao("SGP_BUTTON_NOVO").disabled).toBe(true);
    expect(botao("SGP_BUTTON_EXCLUIR").disabled).toBe(true);

    fireEvent.click(botao("SGP_BUTTON_NOVO"));
    fireEvent.click(screen.getByText("Prova"));
    expect(screen.getByTestId("local").textContent).toBe(ROTAS.TIPO_EVENTOS);
  });

  it("mantém exclusão desabilitada até selecionar um item", async () => {
    renderizar();
    await screen.findByText("Reunião", {}, ESPERA);
    expect(botao("SGP_BUTTON_EXCLUIR").disabled).toBe(true);

    fireEvent.click(checkboxDe("Reunião"));
    await waitFor(() => expect(botao("SGP_BUTTON_EXCLUIR").disabled).toBe(false));
  });

  it("exclui os itens selecionados após confirmação e recarrega a lista", async () => {
    renderizar();
    await screen.findByText("Reunião", {}, ESPERA);

    fireEvent.click(checkboxDe("Reunião"));
    fireEvent.click(checkboxDe("Prova"));
    await waitFor(() => expect(botao("SGP_BUTTON_EXCLUIR").disabled).toBe(false));
    fireEvent.click(botao("SGP_BUTTON_EXCLUIR"));

    await waitFor(() => expect(mocks.confirmar).toHaveBeenCalledTimes(1));
    const args = mocks.confirmar.mock.calls[0];
    expect(args[0]).toBe("Atenção");
    expect(args[1]).toBe("Reunião, Prova");
    expect(args[3]).toBe("Excluir");
    expect(args[4]).toBe("Cancelar");

    await waitFor(() =>
      expect(mocks.sucesso).toHaveBeenCalledWith("Tipos de evento deletados com sucesso!"),
    );
    await waitFor(() => expect(screen.queryByText("Reunião")).toBeNull(), ESPERA);
    expect(screen.queryByText("Prova")).toBeNull();
    expect(await screen.findByText("Feriado")).toBeTruthy();
  });

  it("não exclui quando a confirmação é cancelada", async () => {
    mocks.confirmar.mockResolvedValue(false);
    renderizar();
    await screen.findByText("Reunião", {}, ESPERA);

    fireEvent.click(checkboxDe("Reunião"));
    await waitFor(() => expect(botao("SGP_BUTTON_EXCLUIR").disabled).toBe(false));
    fireEvent.click(botao("SGP_BUTTON_EXCLUIR"));

    await waitFor(() => expect(mocks.confirmar).toHaveBeenCalled());
    expect(mocks.sucesso).not.toHaveBeenCalled();
    expect(screen.getByText("Reunião")).toBeTruthy();
  });

  it("filtra pela busca por descrição após o debounce", async () => {
    renderizar();
    await screen.findByText("Reunião", {}, ESPERA);

    fireEvent.change(screen.getByPlaceholderText("Buscar..."), { target: { value: "prov" } });

    await waitFor(() => expect(screen.queryByText("Reunião")).toBeNull(), { timeout: 5000 });
    expect(screen.getByText("Prova")).toBeTruthy();
  });
});
