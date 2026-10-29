import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockStore } from "../../mocks/mockStore";
import Calendario from "./calendario";

vi.mock("../../services/calendarioService", () => ({
  calendarioService: {
    obterTiposCalendarioAutoComplete: vi.fn().mockResolvedValue({ data: [] }),
    converterModalidade: vi.fn(),
  },
}));

vi.mock("../../services/abrangenciaService", () => ({
  abrangenciaService: {
    buscarDres: vi.fn().mockResolvedValue({ data: [] }),
    buscarUes: vi.fn().mockResolvedValue({ data: [] }),
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

  it.each([
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
  ])("exibe %s", async (rota, titulo) => {
    renderizar(rota);
    expect(await screen.findByRole("heading", { name: titulo })).toBeTruthy();
  });
});
