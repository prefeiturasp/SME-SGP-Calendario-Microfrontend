import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AntdAppProvider } from "../../core/config/antd-app-provider";
import type { PermissoesTela } from "../../core/constantes";
import type { PaginaTiposFeriado } from "../../core/tipoFeriado";
import * as apiSgp from "../../core/servico/apiSgp";
import { createMockStore } from "../../mocks/mockStore";
import { tipoFeriadoService } from "../../services/tipoFeriadoService";
import TipoFeriadoLista from "./TipoFeriadoLista";

// A interação por CSS é verificada nos testes de navegador.
const interagir = () => userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });

const rota = "/calendario-escolar/tipo-feriado";
const todas = { podeConsultar: true, podeIncluir: true, podeAlterar: true, podeExcluir: true };

const Localizacao = () => <output aria-label="Rota atual">{useLocation().pathname}</output>;

const renderizar = (permissoes: PermissoesTela = todas) =>
  render(
    <Provider
      store={createMockStore({ usuario: { logado: true, permissoes: { [rota]: permissoes } } })}
    >
      <MemoryRouter initialEntries={[rota]}>
        <AntdAppProvider>
          <TipoFeriadoLista />
        </AntdAppProvider>
        <Localizacao />
      </MemoryRouter>
    </Provider>
  );

const botao = (nome: string) => screen.getByRole("button", { name: nome }) as HTMLButtonElement;
const checkbox = (nome: string) => screen.getByRole("checkbox", { name: nome }) as HTMLInputElement;
const aguardarLista = () => screen.findByText("Confraternização universal");

describe("listagem de tipos de feriado", () => {
  beforeEach(() => {
    for (const metodo of ["getSgp", "postSgp", "putSgp", "deleteSgp"] as const) {
      vi.spyOn(apiSgp, metodo).mockRejectedValue(new Error("Esta tela não pode usar a API real"));
    }
  });
  afterEach(() => {
    // Preserva o mock global de matchMedia configurado no setup.
    for (const metodo of ["getSgp", "postSgp", "putSgp", "deleteSgp"] as const) {
      vi.mocked(apiSgp[metodo]).mockRestore();
    }
    if (vi.isMockFunction(tipoFeriadoService.listar))
      vi.mocked(tipoFeriadoService.listar).mockRestore();
  });

  it("apresenta a estrutura da referência e a primeira página mockada", async () => {
    renderizar();
    await aguardarLista();

    expect(screen.getByRole("heading", { name: "Lista de tipo de feriado" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Abrangência" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Tipo" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Nome do tipo de feriado" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Nome do Feriado" })).toBeTruthy();
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(11);
    expect(screen.queryByRole("button", { name: "Filtrar" })).toBeNull();
    expect(botao("Excluir").disabled).toBe(true);
    expect(botao("Novo").disabled).toBe(false);
  });

  it("combina os filtros e permite limpar os selects sem precisar recarregar a página", async () => {
    const user = interagir();
    renderizar();
    await aguardarLista();

    await user.click(screen.getByRole("combobox", { name: "Abrangência" }));
    await user.click(screen.getByRole("option", { name: "Municipal" }));
    await user.click(screen.getByRole("combobox", { name: "Tipo" }));
    await user.click(screen.getByRole("option", { name: "Fixo" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nome do tipo de feriado" }), { target: { value: "SÃO PAULO" } });

    await waitFor(() =>
      expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2)
    );
    expect(screen.getByText("Aniversário de São Paulo")).toBeTruthy();
    expect(screen.queryByText("Confraternização universal")).toBeNull();

    await user.clear(screen.getByRole("textbox", { name: "Nome do tipo de feriado" }));
    await user.click(screen.getByRole("button", { name: "Limpar abrangência" }));
    await user.click(screen.getByRole("button", { name: "Limpar tipo" }));
    await aguardarLista();
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(11);
  }, 15000);

  it("preserva a seleção entre páginas e a limpa ao mudar o filtro", async () => {
    const user = interagir();
    renderizar();
    await aguardarLista();
    await user.click(checkbox("Selecionar Confraternização universal"));
    await user.click(screen.getByTitle("2"));
    await screen.findByText("Feriado de demonstração 11");
    expect(screen.queryByText("Confraternização universal")).toBeNull();
    expect(botao("Excluir").disabled).toBe(false);

    fireEvent.change(screen.getByRole("textbox", { name: "Nome do tipo de feriado" }), { target: { value: "São Paulo" } });
    await screen.findByText("Aniversário de São Paulo");
    expect(botao("Excluir").disabled).toBe(true);
    expect(checkbox("Selecionar Aniversário de São Paulo").checked).toBe(false);
  });

  it("representa seleção parcial e seleciona/desmarca somente os itens da página", async () => {
    const user = interagir();
    renderizar();
    await aguardarLista();
    await user.click(checkbox("Selecionar Confraternização universal"));
    await user.click(checkbox("Selecionar Aniversário de São Paulo"));
    expect(checkbox("Selecionar todos desta página").getAttribute("aria-checked")).toBe("mixed");
    expect(botao("Excluir").disabled).toBe(false);

    await user.click(checkbox("Selecionar todos desta página"));
    expect(checkbox("Selecionar todos desta página").checked).toBe(true);
    expect(
      within(screen.getByRole("table"))
        .getAllByRole("checkbox")
        .every((item) => (item as HTMLInputElement).checked)
    ).toBe(true);
    await user.click(checkbox("Selecionar todos desta página"));
    expect(botao("Excluir").disabled).toBe(true);
    expect(screen.queryByText(/Ação demonstrativa/)).toBeNull();
  }, 15000);

  it("mantém Novo, Excluir e edição demonstrativos, sem rede, navegação ou remoção", async () => {
    const user = interagir();
    renderizar();
    await aguardarLista();
    await user.click(checkbox("Selecionar Confraternização universal"));
    await user.click(botao("Novo"));
    await screen.findByText(/Cadastro, edição e exclusão serão disponibilizados/);
    await user.click(botao("Excluir"));
    await user.click(screen.getByText("Confraternização universal"));

    expect(screen.getByLabelText("Rota atual").textContent).toBe(rota);
    expect(screen.getByText("Confraternização universal")).toBeTruthy();
    for (const metodo of ["getSgp", "postSgp", "putSgp", "deleteSgp"] as const) {
      expect(apiSgp[metodo]).not.toHaveBeenCalled();
    }
  }, 15000);

  it("limita ações para um usuário de somente consulta", async () => {
    renderizar({ podeConsultar: true });
    await aguardarLista();
    expect(botao("Novo").disabled).toBe(true);
    expect(botao("Excluir").disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Confraternização universal" })).toBeNull();
    await interagir().click(screen.getByText("Confraternização universal"));
    expect(screen.queryByText(/Ação demonstrativa/)).toBeNull();
  });

  it("permite acionar a demonstração de edição pelo teclado sem selecionar ou navegar", async () => {
    const user = interagir();
    renderizar();
    await aguardarLista();
    const acao = botao("Confraternização universal");
    acao.focus();
    await user.keyboard("{Enter}");

    expect(await screen.findAllByText("Ação demonstrativa")).toHaveLength(1);
    expect(checkbox("Selecionar Confraternização universal").checked).toBe(false);
    expect(botao("Excluir").disabled).toBe(true);
    expect(screen.getByLabelText("Rota atual").textContent).toBe(rota);
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(11);
  });

  it("não consulta ou expõe dados quando não há permissão", async () => {
    const listar = vi.spyOn(tipoFeriadoService, "listar");
    renderizar({});
    expect(
      screen.getByRole("textbox", { name: "Nome do tipo de feriado" }).hasAttribute("disabled")
    ).toBe(true);
    expect(botao("Novo").disabled).toBe(true);
    expect(listar).not.toHaveBeenCalled();
    expect(screen.queryByText("Confraternização universal")).toBeNull();
  });

  it("distingue lista vazia de falha na consulta", async () => {
    const user = interagir();
    renderizar();
    await aguardarLista();
    fireEvent.change(screen.getByRole("textbox", { name: "Nome do tipo de feriado" }), { target: { value: "inexistente" } });
    expect(await screen.findByText("Sem dados")).toBeTruthy();

    vi.spyOn(tipoFeriadoService, "listar").mockRejectedValue(new Error("falha controlada"));
    await user.clear(screen.getByRole("textbox", { name: "Nome do tipo de feriado" }));
    expect(
      await within(screen.getByRole("region", { name: "Tipos de feriado" })).findByRole("alert")
    ).toBeTruthy();
    expect(screen.queryByText("Confraternização universal")).toBeNull();
    expect(screen.queryByText("falha controlada")).toBeNull();
  });

  it("ignora uma resposta antiga que chega depois de uma consulta nova", async () => {
    let resolverAntiga!: (resposta: PaginaTiposFeriado) => void;
    vi.spyOn(tipoFeriadoService, "listar").mockImplementationOnce(
      () =>
        new Promise<PaginaTiposFeriado>((resolve) => {
          resolverAntiga = resolve;
        })
    );
    renderizar();
    fireEvent.change(screen.getByRole("textbox", { name: "Nome do tipo de feriado" }), { target: { value: "São Paulo" } });
    await screen.findByText("Aniversário de São Paulo");

    await act(async () =>
      resolverAntiga({
        total: 1,
        itens: [
          {
            id: 99,
            nome: "Resposta antiga",
            descricaoAbrangencia: "Nacional",
            descricaoTipo: "Fixo",
          },
        ],
      })
    );
    expect(screen.queryByText("Resposta antiga")).toBeNull();
    expect(screen.getByText("Aniversário de São Paulo")).toBeTruthy();
  });

  it("descarta uma falha que chega depois da desmontagem", async () => {
    let rejeitar!: (erro: Error) => void;
    vi.spyOn(tipoFeriadoService, "listar").mockImplementationOnce(
      () =>
        new Promise<PaginaTiposFeriado>((_, reject) => {
          rejeitar = reject;
        })
    );
    const view = renderizar();
    view.unmount();
    await act(async () => rejeitar(new Error("falha depois da saída")));
    expect(screen.queryByText("Ocorreu um erro interno.")).toBeNull();
  });

  it("Voltar retorna ao início", async () => {
    renderizar();
    await aguardarLista();
    await interagir().click(botao("Voltar"));
    expect(screen.getByLabelText("Rota atual").textContent).toBe("/");
  });
});
