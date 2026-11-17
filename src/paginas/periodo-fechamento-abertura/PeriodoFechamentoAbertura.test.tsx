import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FormikProps } from "formik";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROTAS } from "../../core/constantes";
import { createMockStore } from "../../mocks/mockStore";
import PeriodoFechamentoAbertura from "./PeriodoFechamentoAbertura";

const mocks = vi.hoisted(() => ({
  confirmar: vi.fn(),
  sucesso: vi.fn(),
}));

vi.mock("../../core/config/alertas", () => ({
  confirmar: mocks.confirmar,
  sucesso: mocks.sucesso,
}));

vi.mock("../../componentes/ui/CampoData", () => ({
  CampoData: ({
    form,
    name,
    placeholder,
    onChange,
  }: {
    form: FormikProps<Record<string, unknown>>;
    name: string;
    placeholder: string;
    onChange?: () => void;
  }) => {
    const valor = form.values[name];
    const valorInput =
      typeof valor === "string"
        ? valor
        : valor &&
            typeof valor === "object" &&
            "format" in valor &&
            typeof valor.format === "function"
          ? (valor.format as (formato: string) => string)("YYYY-MM-DD")
          : "";

    return (
      <label>
        {placeholder}
        <input
          type="date"
          aria-label={placeholder}
          value={valorInput}
          onChange={(evento) => {
            void form.setFieldValue(name, evento.target.value);
            onChange?.();
          }}
        />
      </label>
    );
  },
}));

vi.mock("../../componentes/ui/SelectAutocomplete", () => ({
  SelectAutocomplete: ({
    id,
    label,
    lista,
    value,
    onSelect,
    handleSearch,
  }: {
    id: string;
    label: string;
    lista: { id?: number | string; descricao: string }[];
    value?: string;
    onSelect?: (descricao: string) => void;
    handleSearch?: (descricao: string) => void;
  }) => (
    <label htmlFor={id}>
      {label}
      <select
        id={id}
        aria-label={label}
        value={value || ""}
        onChange={(evento) => {
          const descricao = evento.target.value;
          onSelect?.(descricao);
          handleSearch?.(descricao);
        }}
      >
        <option value="">Selecione</option>
        {lista.map((item) => (
          <option key={item.id} value={item.descricao}>
            {item.descricao}
          </option>
        ))}
      </select>
    </label>
  ),
}));

const renderizar = () => {
  const store = createMockStore({
    usuario: {
      logado: true,
      permissoes: {
        [ROTAS.PERIODO_FECHAMENTO_ABERTURA]: {
          podeConsultar: true,
          podeIncluir: true,
          podeAlterar: true,
        },
      },
    },
    navegacao: { rotaAtiva: ROTAS.PERIODO_FECHAMENTO_ABERTURA },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[ROTAS.PERIODO_FECHAMENTO_ABERTURA]}>
        <PeriodoFechamentoAbertura />
      </MemoryRouter>
    </Provider>,
  );
};

const selecionarCalendario = (descricao: string) => {
  fireEvent.change(screen.getByLabelText("Calendário"), {
    target: { value: descricao },
  });
};

describe("PeriodoFechamentoAbertura", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirmar.mockResolvedValue(true);
  });

  it("exibe os calendários e períodos bimestrais mockados", async () => {
    renderizar();
    selecionarCalendario("Calendário Fundamental/Médio 2026");

    expect(await screen.findByText("Registro Migrado")).toBeTruthy();
    expect(screen.getAllByLabelText("Início do Bimestre")).toHaveLength(4);
    expect(screen.getAllByLabelText("Fim do Bimestre")).toHaveLength(4);
    expect(mocks.sucesso).not.toHaveBeenCalled();
  });

  it("permite escolher outro calendário sem limpar o campo", async () => {
    renderizar();
    selecionarCalendario("Calendário Fundamental/Médio 2026");

    const seletor = screen.getByLabelText("Calendário") as HTMLSelectElement;
    await waitFor(() => {
      expect(seletor.options).toHaveLength(4);
    });

    fireEvent.change(seletor, {
      target: { value: "Calendário EJA 2026 - 1º semestre" },
    });

    await waitFor(() => {
      expect(seletor.value).toBe("Calendário EJA 2026 - 1º semestre");
      expect(screen.getAllByLabelText("Início do Bimestre")).toHaveLength(2);
    });
  });

  it("salva as alterações localmente e as mantém ao recarregar o calendário", async () => {
    renderizar();
    selecionarCalendario("Calendário Fundamental/Médio 2026");

    const campoInicio = (await screen.findAllByLabelText(
      "Início do Bimestre",
    ))[0] as HTMLInputElement;
    expect(campoInicio.value).toBe("2026-01-10");
    fireEvent.change(campoInicio, { target: { value: "2026-01-11" } });
    fireEvent.click(screen.getByRole("button", { name: "Alterar" }));

    await waitFor(() => {
      expect(mocks.sucesso).toHaveBeenCalledWith("Períodos salvos com sucesso.");
      expect(
        (screen.getAllByLabelText("Início do Bimestre")[0] as HTMLInputElement)
          .value,
      ).toBe("2026-01-11");
    });
  });

  it("cancela as alterações e restaura os dados mockados", async () => {
    renderizar();
    selecionarCalendario("Calendário Fundamental/Médio 2026");

    const campoInicio = (await screen.findAllByLabelText(
      "Início do Bimestre",
    ))[0] as HTMLInputElement;
    fireEvent.change(campoInicio, { target: { value: "2026-01-11" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => {
      expect(mocks.confirmar).toHaveBeenCalledWith(
        "Atenção",
        "Você não salvou as informações preenchidas.",
        "Deseja realmente cancelar as alterações?",
      );
      expect(
        (screen.getAllByLabelText("Início do Bimestre")[0] as HTMLInputElement)
          .value,
      ).toBe("2026-01-10");
    });
  });

  it("mantém o calendário semestral com dois bimestres", async () => {
    renderizar();
    selecionarCalendario("Calendário EJA 2026 - 1º semestre");

    expect(screen.getAllByLabelText("Início do Bimestre")).toHaveLength(2);
    expect(screen.getAllByLabelText("Fim do Bimestre")).toHaveLength(2);
    expect(screen.queryByText("Registro Migrado")).toBeNull();
  });
});
