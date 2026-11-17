import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AntdAppProvider } from "../../core/config/antd-app-provider";
import type { PermissoesTela } from "../../core/constantes";
import type { PeriodoEscolarApi } from "../../core/regras/periodoEscolar";
import * as apiSgp from "../../core/servico/apiSgp";
import { createMockStore } from "../../mocks/mockStore";
import { periodoEscolarService } from "../../services/periodoEscolarService";
import PeriodosEscolares from "./PeriodosEscolares";

const rota = "/calendario-escolar/periodos-escolares";
const permissoesCompletas = {
  podeConsultar: true,
  podeIncluir: true,
  podeAlterar: true,
  podeExcluir: true,
};
const infantil = "2026 - INF - CALENDÁRIO DE ATIVIDADES 2026 - ED. INFANTIL";
const fundamental = "2026 - EF - CALENDÁRIO 2026 - ENSINO FUNDAMENTAL";
const eja = "2026 - EJA - CALENDÁRIO 2026 - 2º SEMESTRE";
const Localizacao = () => (
  <output aria-label="Rota atual">{useLocation().pathname}</output>
);
const clicar = async (elemento: Element) => {
  await act(async () => {
    fireEvent.mouseDown(elemento);
    if (elemento instanceof HTMLElement) elemento.focus();
    fireEvent.mouseUp(elemento);
    fireEvent.click(elemento);
  });
};
const botao = (nome: string) =>
  screen.getByRole("button", { name: nome }) as HTMLButtonElement;
const data = (nome: string) =>
  screen.getByRole("textbox", { name: nome }) as HTMLInputElement;
const escolherOpcao = async (descricao: string) => {
  const textos = await screen.findAllByText(descricao);
  const opcao = textos.find((elemento) =>
    elemento.closest(".ant-select-item-option")
  );
  expect(opcao).toBeTruthy();
  await clicar(opcao!);
};

const renderizar = (permissoes: PermissoesTela = permissoesCompletas) =>
  render(
    <Provider
      store={createMockStore({
        usuario: { logado: true, permissoes: { [rota]: permissoes } },
      })}
    >
      <MemoryRouter initialEntries={[rota]}>
        <AntdAppProvider>
          <PeriodosEscolares />
        </AntdAppProvider>
        <Localizacao />
      </MemoryRouter>
    </Provider>
  );
const selecionar = async (descricao: string) => {
  const input = screen.getByRole("combobox", { name: /Calendário/ });
  await act(async () => {
    fireEvent.change(input, { target: { value: "" } });
  });
  await clicar(input);
  await escolherOpcao(descricao);
  await act(async () => {});
  await waitFor(() =>
    expect(
      screen
        .getByRole("region", { name: "Períodos escolares" })
        .getAttribute("aria-busy")
    ).toBe("false")
  );
  if (descricao === infantil) {
    await waitFor(() =>
      expect(data("Início do 1º Bimestre").value).toBe("04/02/2026")
    );
  } else {
    await waitFor(() => expect(botao("Cadastrar").disabled).toBe(false));
  }
};
const preencher = async (nome: string, valor: string) => {
  const input = data(nome);
  await clicar(input);
  fireEvent.change(input, { target: { value: valor } });
  await act(async () => {});
  await act(async () => {
    fireEvent.keyDown(input, {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
    });
  });
  await act(async () => {
    input.blur();
  });
};

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  for (const metodo of ["getSgp", "postSgp", "putSgp", "deleteSgp"] as const) {
    vi.spyOn(apiSgp, metodo).mockRejectedValue(
      new Error("A tela deve funcionar sem backend")
    );
  }
});
afterEach(() => {
  for (const metodo of ["getSgp", "postSgp", "putSgp", "deleteSgp"] as const) {
    expect(apiSgp[metodo]).not.toHaveBeenCalled();
    vi.mocked(apiSgp[metodo]).mockRestore();
  }
  for (const metodo of [
    "listarCalendarios",
    "obterPorTipoCalendario",
    "salvar",
  ] as const) {
    if (vi.isMockFunction(periodoEscolarService[metodo]))
      vi.mocked(periodoEscolarService[metodo]).mockRestore();
  }
  window.history.replaceState(null, "", "/");
});

describe("cadastro mockado de bimestres", () => {
  it("carrega os quatro bimestres e a auditoria da referência, com edição inicialmente desabilitada", async () => {
    renderizar();
    expect(botao("Cadastrar").disabled).toBe(true);
    await selecionar(infantil);
    expect(
      screen.getByRole("heading", { name: "Cadastro do período escolar" })
    ).toBeTruthy();
    expect(screen.getAllByRole("group")).toHaveLength(4);
    expect(data("Início do 1º Bimestre").value).toBe("04/02/2026");
    expect(data("Fim do 4º Bimestre").value).toBe("22/12/2026");
    expect(
      screen.getByText(/INSERIDO por Usuário de demonstração/)
    ).toBeTruthy();
    expect(botao("Alterar").disabled).toBe(true);
    expect(botao("Cancelar").disabled).toBe(true);
  }, 15000);

  it("simula edição com sucesso e restaura a referência ao consultar novamente", async () => {
    renderizar();
    await selecionar(infantil);
    await preencher("Fim do 1º Bimestre", "29/04/2026");
    await waitFor(() => expect(botao("Alterar").disabled).toBe(false));
    await clicar(botao("Alterar"));
    expect(
      await screen.findByText("Suas informações foram editadas com sucesso.")
    ).toBeTruthy();
    expect(data("Fim do 1º Bimestre").value).toBe("29/04/2026");
    await selecionar(fundamental);
    await selecionar(infantil);
    expect(data("Fim do 1º Bimestre").value).toBe("30/04/2026");
  }, 15000);

  it("apresenta o erro de sobreposição do mock e mantém os valores para correção", async () => {
    renderizar();
    await selecionar(infantil);
    await preencher("Início do 2º Bimestre", "30/04/2026");
    await clicar(botao("Alterar"));
    expect(
      await screen.findByText("As datas do 1º e do 2º bimestres se sobrepõem.")
    ).toBeTruthy();
    expect(data("Início do 2º Bimestre").value).toBe("30/04/2026");
    expect(screen.queryByText(/informações foram editadas/)).toBeNull();
    expect(botao("Alterar").disabled).toBe(false);
  }, 15000);

  it("exige as datas antes de chamar o mock de gravação", async () => {
    const salvar = vi.spyOn(periodoEscolarService, "salvar");
    renderizar();
    await selecionar(fundamental);
    await clicar(botao("Cadastrar"));
    expect(await screen.findAllByText("Data inicial obrigatória")).toHaveLength(
      4
    );
    expect(screen.getAllByText("Data final obrigatória")).toHaveLength(4);
    expect(salvar).not.toHaveBeenCalled();
  }, 15000);

  it("cadastra dois bimestres no calendário semestral sem persistir", async () => {
    renderizar();
    await selecionar(eja);
    expect(screen.getAllByRole("group")).toHaveLength(2);
    await preencher("Início do 1º Bimestre", "18/07/2026");
    await preencher("Fim do 1º Bimestre", "30/09/2026");
    await preencher("Início do 2º Bimestre", "01/10/2026");
    await preencher("Fim do 2º Bimestre", "22/12/2026");
    await clicar(botao("Cadastrar"));
    expect(
      await screen.findByText("Suas informações foram salvas com sucesso.")
    ).toBeTruthy();
    expect(botao("Alterar").disabled).toBe(true);
    await selecionar(infantil);
    await selecionar(eja);
    expect(data("Início do 1º Bimestre").value).toBe("");
    expect(botao("Cadastrar").disabled).toBe(false);
  }, 15000);

  it("confirma o cancelamento e restaura as datas consultadas", async () => {
    renderizar();
    await selecionar(infantil);
    await preencher("Fim do 1º Bimestre", "29/04/2026");
    await clicar(botao("Cancelar"));
    expect(
      await screen.findByText(/Deseja realmente cancelar as alterações/)
    ).toBeTruthy();
    await clicar(botao("Confirmar"));
    await waitFor(() =>
      expect(data("Fim do 1º Bimestre").value).toBe("30/04/2026")
    );
    expect(botao("Cancelar").disabled).toBe(true);
  }, 15000);

  it("permite consulta e restringe inclusão e alteração separadamente", async () => {
    renderizar({ podeConsultar: true, podeIncluir: true });
    await selecionar(infantil);
    expect(data("Início do 1º Bimestre").disabled).toBe(true);
    expect(botao("Alterar").disabled).toBe(true);
    await selecionar(fundamental);
    expect(data("Início do 1º Bimestre").disabled).toBe(false);
    expect(botao("Cadastrar").disabled).toBe(false);
  }, 15000);

  it("não consulta nem expõe dados sem permissão", async () => {
    const listar = vi.spyOn(periodoEscolarService, "listarCalendarios");
    const consultar = vi.spyOn(periodoEscolarService, "obterPorTipoCalendario");
    renderizar({});
    expect(
      (screen.getByRole("combobox", { name: /Calendário/ }) as HTMLInputElement)
        .disabled
    ).toBe(true);
    expect(listar).not.toHaveBeenCalled();
    expect(consultar).not.toHaveBeenCalled();
    expect(screen.queryByRole("group")).toBeNull();
  }, 15000);

  it("ignora uma consulta antiga ao trocar de calendário", async () => {
    let resolver!: (dados: PeriodoEscolarApi | null) => void;
    vi.spyOn(
      periodoEscolarService,
      "obterPorTipoCalendario"
    ).mockImplementationOnce(
      () =>
        new Promise<PeriodoEscolarApi | null>((resolve) => {
          resolver = resolve;
        })
    );
    renderizar();
    await clicar(screen.getByRole("combobox", { name: /Calendário/ }));
    await escolherOpcao(infantil);
    await selecionar(fundamental);
    await act(async () =>
      resolver({
        tipoCalendario: 1,
        periodos: [
          {
            id: 11,
            bimestre: 1,
            periodoInicio: "2026-02-04",
            periodoFim: "2026-04-30",
          },
        ],
      })
    );
    expect(data("Início do 1º Bimestre").value).toBe("");
    expect(botao("Cadastrar").disabled).toBe(false);
  }, 15000);

  it("Voltar permite descartar alterações e retorna ao início", async () => {
    renderizar();
    await selecionar(infantil);
    await preencher("Fim do 1º Bimestre", "29/04/2026");
    await clicar(botao("Voltar"));
    expect(await screen.findByText(/deseja salvar agora/)).toBeTruthy();
    // O Cancelar do diálogo descarta as alterações, conforme o fluxo legado.
    await clicar(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancelar",
      })
    );
    expect(screen.getByLabelText("Rota atual").textContent).toBe("/");
  }, 15000);
});
