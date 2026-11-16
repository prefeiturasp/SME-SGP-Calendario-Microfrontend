import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockStore } from "../../mocks/mockStore";
import Calendario from "./calendario";

vi.mock("../../services/calendarioService", () => ({
  calendarioService: {
    listarTiposCalendario: vi.fn().mockResolvedValue({ data: [] }),
    excluirTiposCalendario: vi.fn().mockResolvedValue({}),
    obterTipoCalendario: vi.fn().mockResolvedValue({
      data: {
        id: 1,
        nome: "Calendário",
        anoLetivo: 2026,
        modalidade: 1,
        periodo: 1,
        situacao: true,
      },
    }),
    salvarTipoCalendario: vi.fn().mockResolvedValue({}),
    obterTiposCalendarioAutoComplete: vi.fn().mockResolvedValue({ data: [] }),
    converterModalidade: vi.fn(),
  },
}));

vi.mock("../../services/abrangenciaService", () => ({
  abrangenciaService: {
    buscarDres: vi.fn().mockResolvedValue({ data: [] }),
    buscarUes: vi.fn().mockResolvedValue({ data: [] }),
    buscarTodosAnosLetivos: vi.fn().mockResolvedValue({ data: [2026] }),
  },
}));

vi.mock("../../services/eventoService", () => ({
  eventoService: {
    obterTiposCalendario: vi.fn().mockResolvedValue({ data: [] }),
    buscarDres: vi.fn().mockResolvedValue({ data: [] }),
    buscarUes: vi.fn().mockResolvedValue({ data: [] }),
    obterTiposEvento: vi.fn().mockResolvedValue({ data: { items: [] } }),
    listar: vi.fn().mockResolvedValue({ data: { items: [], totalRegistros: 0 } }),
    deletar: vi.fn().mockResolvedValue({ status: 200, data: [] }),
  },
}));

const renderizar = (rota: string) =>
  render(
    <Provider store={createMockStore()}>
      <MemoryRouter initialEntries={[rota]}>
        <Calendario apiUrl="http://localhost:5000/api" />
      </MemoryRouter>
    </Provider>,
  );

describe("Calendario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it.each([
    ["/calendario-escolar/eventos", "Eventos do calendário escolar (Micro frontend)"],
    ["/calendario-escolar/eventos/10", "Eventos do calendário escolar (Micro frontend)"],
    ["/calendario-escolar/eventos/novo/1", "Cadastro de eventos do calendário escolar (Micro frontend)"],
    ["/calendario-escolar/eventos/editar/5/1", "Cadastro de eventos do calendário escolar (Micro frontend)"],
    ["/calendario-escolar/tipo-feriado", "Lista de tipo de feriado"],
    ["/calendario-escolar/periodos-escolares", "Cadastro do período escolar (Micro frontend)"],
    [
      "/calendario-escolar/periodo-fechamento-abertura",
      "Período de Fechamento (Abertura) (Micro frontend)",
    ],
    [
      "/calendario-escolar/periodo-fechamento-reabertura",
      "Período de Fechamento (Reabertura) (Micro frontend)",
    ],
    [
      "/calendario-escolar/periodo-fechamento-reabertura/novo/15",
      "Período de Fechamento (Reabertura) (Micro frontend)",
    ],
    [
      "/calendario-escolar/tipo-calendario-escolar",
      "Tipo de calendário escolar",
    ],
    [
      "/calendario-escolar/tipo-calendario-escolar/novo",
      "Cadastro do Tipo de Calendário Escolar",
    ],
    [
      "/calendario-escolar/tipo-calendario-escolar/editar/1",
      "Alterar Tipo de Calendário Escolar",
    ],
    ["/calendario-escolar/tipo-eventos/novo", "Cadastro de Tipo de Eventos"],
  ])("exibe %s", async (rota, titulo) => {
    renderizar(rota);
    expect(await screen.findByRole("heading", { name: titulo })).toBeTruthy();
  });

  it("acompanha a URL do host ao entrar na listagem a partir de outra tela", async () => {
    window.history.replaceState(null, "", "/calendario-escolar/tipo-feriado");
    renderizar("/calendario-escolar/periodos-escolares");
    expect(await screen.findByRole("heading", { name: "Lista de tipo de feriado" })).toBeTruthy();
  });
});
