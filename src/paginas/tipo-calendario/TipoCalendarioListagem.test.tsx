import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROTAS, type PermissoesTela } from "../../core/constantes";
import { createMockStore } from "../../mocks/mockStore";
import {
  obterTiposCalendarioMockados,
  reinicializarTiposCalendarioMockados,
} from "../../mocks/tiposCalendarioMockados";
import TipoCalendarioListagem from "./TipoCalendarioListagem";

const mocks = vi.hoisted(() => ({
  listarTiposCalendario: vi.fn(),
  excluirTiposCalendario: vi.fn(),
  confirmar: vi.fn(),
  exibirErrosApi: vi.fn(),
  sucesso: vi.fn(),
}));

vi.mock("../../services/calendarioService", () => ({
  calendarioService: {
    listarTiposCalendario: mocks.listarTiposCalendario,
    excluirTiposCalendario: mocks.excluirTiposCalendario,
  },
}));

vi.mock("../../core/config/alertas", () => ({
  confirmar: mocks.confirmar,
  exibirErrosApi: mocks.exibirErrosApi,
  sucesso: mocks.sucesso,
}));

const tipos = [
  {
    id: 1,
    descricao: "Calendário anual",
    nome: "Calendário anual",
    anoLetivo: 2026,
    descricaoPeriodo: "Anual",
  },
  {
    id: 2,
    descricao: "Calendário semestral",
    nome: "Calendário semestral",
    anoLetivo: 2026,
    descricaoPeriodo: "Semestral",
  },
];

const permissoesCompletas: PermissoesTela = {
  podeConsultar: true,
  podeIncluir: true,
  podeAlterar: true,
  podeExcluir: true,
};

const LocalizacaoAtual = () => {
  const location = useLocation();
  return <output data-testid="localizacao">{location.pathname}</output>;
};

const renderizar = (permissoes = permissoesCompletas) => {
  const store = createMockStore({
    usuario: {
      logado: true,
      permissoes: {
        [ROTAS.TIPO_CALENDARIO_ESCOLAR]: permissoes,
      },
    },
    navegacao: {
      rotaAtiva: ROTAS.TIPO_CALENDARIO_ESCOLAR,
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[ROTAS.TIPO_CALENDARIO_ESCOLAR]}>
        <TipoCalendarioListagem />
        <LocalizacaoAtual />
      </MemoryRouter>
    </Provider>,
  );
};

describe("TipoCalendarioListagem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reinicializarTiposCalendarioMockados();
    mocks.listarTiposCalendario.mockResolvedValue({ data: tipos });
    mocks.excluirTiposCalendario.mockResolvedValue({});
    mocks.confirmar.mockResolvedValue(true);
  });

  it("consulta e exibe os tipos de calendário", async () => {
    renderizar();

    expect(await screen.findByText("Calendário anual")).toBeTruthy();
    expect(screen.getByText("Calendário semestral")).toBeTruthy();
    expect(mocks.listarTiposCalendario).not.toHaveBeenCalled();
  });

  it("navega para edição ao clicar em uma linha", async () => {
    renderizar();
    fireEvent.click(await screen.findByText("Calendário anual"));

    await waitFor(() => {
      expect(screen.getByTestId("localizacao").textContent).toBe(
        `${ROTAS.TIPO_CALENDARIO_ESCOLAR}/editar/1`,
      );
    });
  });

  it("navega para novo cadastro e volta para a página inicial", async () => {
    renderizar();
    await screen.findByText("Calendário anual");
    fireEvent.click(document.getElementById("SGP_BUTTON_NOVO") as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId("localizacao").textContent).toBe(
        `${ROTAS.TIPO_CALENDARIO_ESCOLAR}/novo`,
      );
    });

    fireEvent.click(document.getElementById("SGP_BUTTON_VOLTAR") as HTMLElement);
    await waitFor(() => {
      expect(screen.getByTestId("localizacao").textContent).toBe("/");
    });
  });

  it("não navega ao selecionar uma linha e habilita exclusão", async () => {
    renderizar();
    const linha = (await screen.findByText("Calendário anual")).closest("tr");
    expect(linha).toBeTruthy();

    fireEvent.click(within(linha as HTMLElement).getByRole("checkbox"));
    fireEvent.click(
      linha?.querySelector(".ant-table-selection-column") as HTMLElement,
    );

    expect(screen.getByTestId("localizacao").textContent).toBe(
      ROTAS.TIPO_CALENDARIO_ESCOLAR,
    );
    expect(
      (document.getElementById("SGP_BUTTON_EXCLUIR") as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it("respeita permissões para incluir e excluir", async () => {
    renderizar({ podeConsultar: true });

    expect(await screen.findByText("Calendário anual")).toBeTruthy();
    expect(
      (document.getElementById("SGP_BUTTON_NOVO") as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (document.getElementById("SGP_BUTTON_EXCLUIR") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("confirma a exclusão, remove os itens selecionados e atualiza a lista", async () => {
    renderizar();
    const linha = (await screen.findByText("Calendário anual")).closest("tr");
    expect(linha).toBeTruthy();
    fireEvent.click(within(linha as HTMLElement).getByRole("checkbox"));
    fireEvent.click(document.getElementById("SGP_BUTTON_EXCLUIR") as HTMLElement);

    await waitFor(() => {
      expect(mocks.confirmar).toHaveBeenCalledWith(
        "Excluir tipo de calendário escolar",
        "Calendário anual",
        "Deseja realmente excluir este calendário?",
        "Excluir",
        "Cancelar",
      );
      expect(mocks.excluirTiposCalendario).not.toHaveBeenCalled();
      expect(mocks.sucesso).toHaveBeenCalledWith(
        "Tipo de calendário excluído com sucesso.",
      );
      expect(mocks.listarTiposCalendario).not.toHaveBeenCalled();
    });
    expect(screen.queryByText("Calendário anual")).toBeNull();
    expect(obterTiposCalendarioMockados()).not.toContainEqual(
      expect.objectContaining({ id: 1 }),
    );
  });

  it("usa as mensagens no plural ao excluir vários tipos", async () => {
    renderizar();
    const linhaAnual = (await screen.findByText("Calendário anual")).closest("tr");
    const linhaSemestral = screen
      .getByText("Calendário semestral")
      .closest("tr");
    expect(linhaAnual).toBeTruthy();
    expect(linhaSemestral).toBeTruthy();
    fireEvent.click(within(linhaAnual as HTMLElement).getByRole("checkbox"));
    fireEvent.click(within(linhaSemestral as HTMLElement).getByRole("checkbox"));
    fireEvent.click(document.getElementById("SGP_BUTTON_EXCLUIR") as HTMLElement);

    await waitFor(() => {
      expect(mocks.confirmar).toHaveBeenCalledWith(
        "Excluir tipo de calendário escolar",
        "Calendário anual, Calendário semestral",
        "Deseja realmente excluir estes calendários?",
        "Excluir",
        "Cancelar",
      );
      expect(mocks.excluirTiposCalendario).not.toHaveBeenCalled();
      expect(mocks.sucesso).toHaveBeenCalledWith(
        "Tipos de calendário excluído com sucesso.",
      );
    });
  });

  it("não exclui quando a confirmação é cancelada", async () => {
    mocks.confirmar.mockResolvedValueOnce(false);
    renderizar();
    const linha = (await screen.findByText("Calendário anual")).closest("tr");
    expect(linha).toBeTruthy();
    fireEvent.click(within(linha as HTMLElement).getByRole("checkbox"));
    fireEvent.click(document.getElementById("SGP_BUTTON_EXCLUIR") as HTMLElement);

    await waitFor(() => {
      expect(mocks.confirmar).toHaveBeenCalledOnce();
    });
    expect(mocks.excluirTiposCalendario).not.toHaveBeenCalled();
    expect(mocks.listarTiposCalendario).not.toHaveBeenCalled();
  });

  it("remove da lista mockada sem chamar a API", async () => {
    renderizar();
    const linha = (await screen.findByText("Calendário anual")).closest("tr");
    expect(linha).toBeTruthy();
    fireEvent.click(within(linha as HTMLElement).getByRole("checkbox"));
    fireEvent.click(document.getElementById("SGP_BUTTON_EXCLUIR") as HTMLElement);

    await waitFor(() => {
      expect(mocks.excluirTiposCalendario).not.toHaveBeenCalled();
      expect(obterTiposCalendarioMockados()).not.toContainEqual(
        expect.objectContaining({ id: 1 }),
      );
    });
  });
});
