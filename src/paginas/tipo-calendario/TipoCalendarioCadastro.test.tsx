import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROTAS } from "../../core/constantes";
import { createMockStore } from "../../mocks/mockStore";
import { obterTiposCalendarioMockados } from "../../mocks/tiposCalendarioMockados";
import TipoCalendarioCadastro from "./TipoCalendarioCadastro";

const mocks = vi.hoisted(() => ({
  buscarTodosAnosLetivos: vi.fn(),
  obterTipoCalendario: vi.fn(),
  salvarTipoCalendario: vi.fn(),
  excluirTiposCalendario: vi.fn(),
  confirmar: vi.fn(),
  erro: vi.fn(),
  exibirErrosApi: vi.fn(),
  sucesso: vi.fn(),
}));

vi.mock("../../services/abrangenciaService", () => ({
  abrangenciaService: {
    buscarTodosAnosLetivos: mocks.buscarTodosAnosLetivos,
  },
}));

vi.mock("../../services/calendarioService", () => ({
  calendarioService: {
    obterTipoCalendario: mocks.obterTipoCalendario,
    salvarTipoCalendario: mocks.salvarTipoCalendario,
    excluirTiposCalendario: mocks.excluirTiposCalendario,
  },
}));

vi.mock("../../core/config/alertas", () => ({
  confirmar: mocks.confirmar,
  erro: mocks.erro,
  exibirErrosApi: mocks.exibirErrosApi,
  sucesso: mocks.sucesso,
}));

vi.mock("../../componentes/ui/SelectCampo", () => ({
  SelectCampo: ({
    id,
    label,
    lista,
    value,
    valueOption,
    valueText,
    disabled,
    erro,
    onChange,
  }: {
    id: string;
    label?: string;
    lista: Record<string, unknown>[];
    value?: string | string[];
    valueOption: string;
    valueText: string;
    disabled?: boolean;
    erro?: string;
    onChange: (valor: string | string[]) => void;
  }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={Array.isArray(value) ? value[0] : value || ""}
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
      {erro && <span>{erro}</span>}
    </div>
  ),
}));

const LocalizacaoAtual = () => {
  const location = useLocation();
  return <output data-testid="localizacao">{location.pathname}</output>;
};

const detalhe = {
  id: 7,
  nome: "Calendário vigente",
  anoLetivo: 2026,
  modalidade: 1,
  periodo: 1,
  situacao: true,
  semestre: null,
  possuiEventos: false,
  criadoPor: "Usuário",
  criadoRF: 123,
  criadoEm: "2026-01-01T10:00:00",
};

const renderizar = (rota: string, permissoes = {
  podeConsultar: true,
  podeIncluir: true,
  podeAlterar: true,
  podeExcluir: true,
}) => {
  const store = createMockStore({
    usuario: {
      logado: true,
      permissoes: {
        [ROTAS.TIPO_CALENDARIO_ESCOLAR]: permissoes,
      },
      turmaSelecionada: { anoLetivo: 2026 },
    },
    navegacao: { rotaAtiva: ROTAS.TIPO_CALENDARIO_ESCOLAR },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[rota]}>
        <TipoCalendarioCadastro />
        <LocalizacaoAtual />
      </MemoryRouter>
    </Provider>,
  );
};

describe("TipoCalendarioCadastro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buscarTodosAnosLetivos.mockResolvedValue({ data: [2026, 2027] });
    mocks.obterTipoCalendario.mockResolvedValue({ data: detalhe });
    mocks.salvarTipoCalendario.mockResolvedValue({});
    mocks.excluirTiposCalendario.mockResolvedValue({});
    mocks.confirmar.mockResolvedValue(true);
  });

  it("carrega os anos letivos e cadastra um tipo de calendário", async () => {
    renderizar(`${ROTAS.TIPO_CALENDARIO_ESCOLAR}/novo`);

    expect(await screen.findByText("Cadastro do Tipo de Calendário Escolar")).toBeTruthy();
    await waitFor(() => {
      expect(mocks.buscarTodosAnosLetivos).toHaveBeenCalledOnce();
    });
    fireEvent.change(screen.getByLabelText(/Nome do calendário/), {
      target: { value: "Novo calendário" },
    });
    fireEvent.change(screen.getByLabelText(/Modalidade/), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "Anual" }));
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => {
      expect(mocks.salvarTipoCalendario).not.toHaveBeenCalled();
      expect(obterTiposCalendarioMockados()).toContainEqual(
        expect.objectContaining({
          nome: "Novo calendário",
          anoLetivo: 2026,
          descricaoPeriodo: "Anual",
        }),
      );
      expect(screen.getByTestId("localizacao").textContent).toBe(
        ROTAS.TIPO_CALENDARIO_ESCOLAR,
      );
    });
  });

  it("carrega os dados, atualiza o tipo e exibe auditoria", async () => {
    renderizar(`${ROTAS.TIPO_CALENDARIO_ESCOLAR}/editar/7`);

    expect(await screen.findByDisplayValue("Calendário vigente")).toBeTruthy();
    expect(mocks.obterTipoCalendario).toHaveBeenCalledWith("7");
    expect(await screen.findByText(/INSERIDO por Usuário \(123\)/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Nome do calendário/), {
      target: { value: "Calendário atualizado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar" }));

    await waitFor(() => {
      expect(mocks.salvarTipoCalendario).not.toHaveBeenCalled();
      expect(obterTiposCalendarioMockados()).toContainEqual(
        expect.objectContaining({
          id: 7,
          nome: "Calendário atualizado",
          anoLetivo: 2026,
        }),
      );
      expect(screen.getByTestId("localizacao").textContent).toBe(
        ROTAS.TIPO_CALENDARIO_ESCOLAR,
      );
    });
  });

  it("exige semestre para EJA e envia o período semestral", async () => {
    renderizar(`${ROTAS.TIPO_CALENDARIO_ESCOLAR}/novo`);
    await screen.findByText("Cadastro do Tipo de Calendário Escolar");
    fireEvent.change(screen.getByLabelText(/Nome do calendário/), {
      target: { value: "Calendário EJA" },
    });
    fireEvent.change(screen.getByLabelText(/Modalidade/), {
      target: { value: "2" },
    });
    await waitFor(() => {
      expect((screen.getByLabelText(/Modalidade/) as HTMLSelectElement).value).toBe(
        "2",
      );
      expect(
        (screen.getByRole("radio", { name: "Semestral" }) as HTMLInputElement)
          .checked,
      ).toBe(true);
    });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("Semestre obrigatório")).toBeTruthy();
    expect(mocks.salvarTipoCalendario).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Semestre/), {
      target: { value: "1" },
    });
    await waitFor(() => {
      expect((screen.getByLabelText(/Semestre/) as HTMLSelectElement).value).toBe(
        "1",
      );
      expect(screen.queryByText("Semestre obrigatório")).toBeNull();
    });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));
    await waitFor(() => {
      expect(
        Array.from(document.querySelectorAll(".campo-erro")).map(
          (campo) => campo.textContent,
        ),
      ).toEqual([]);
    });

    await waitFor(() => {
      expect(mocks.salvarTipoCalendario).not.toHaveBeenCalled();
      expect(obterTiposCalendarioMockados()).toContainEqual(
        expect.objectContaining({
          nome: "Calendário EJA",
          modalidade: 2,
          periodo: 2,
          descricaoPeriodo: "Semestral",
        }),
      );
    });
  });

  it("confirma e exclui um tipo de calendário sem eventos", async () => {
    renderizar(`${ROTAS.TIPO_CALENDARIO_ESCOLAR}/editar/7`);
    await screen.findByDisplayValue("Calendário vigente");
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(mocks.confirmar).toHaveBeenCalledWith(
        "Excluir tipo de calendário escolar",
        "",
        "Deseja realmente excluir este calendário?",
        "Excluir",
        "Cancelar",
      );
      expect(mocks.excluirTiposCalendario).toHaveBeenCalledWith(["7"]);
      expect(screen.getByTestId("localizacao").textContent).toBe(
        ROTAS.TIPO_CALENDARIO_ESCOLAR,
      );
    });
  });

  it("bloqueia edição e exclusão quando o tipo já possui eventos", async () => {
    mocks.obterTipoCalendario.mockResolvedValueOnce({
      data: { ...detalhe, possuiEventos: true },
    });
    renderizar(`${ROTAS.TIPO_CALENDARIO_ESCOLAR}/editar/7`);
    await screen.findByDisplayValue("Calendário vigente");

    expect((screen.getByLabelText(/Modalidade/) as HTMLSelectElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole("radio", { name: "Anual" }) as HTMLInputElement).disabled).toBe(
      true,
    );
    expect(
      (screen.getByRole("button", { name: "Excluir" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("exibe erros se a consulta do calendário falhar", async () => {
    const falha = new Error("Falha na consulta");
    mocks.obterTipoCalendario.mockRejectedValueOnce(falha);
    renderizar(`${ROTAS.TIPO_CALENDARIO_ESCOLAR}/editar/7`);

    await waitFor(() => {
      expect(mocks.exibirErrosApi).toHaveBeenCalledWith(falha, true);
    });
  });
});
