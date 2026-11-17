import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const item = (id: number, descricao: string, letivo: number, localOcorrencia: number) => ({
    id,
    descricao,
    letivo,
    localOcorrencia,
  });
  return {
    exibirErrosApi: vi.fn(),
    dados: [
      item(1, "Reunião", 1, 2),
      item(2, "Prova", 2, 3),
      item(3, "Feriado", 1, 3),
      ...Array.from({ length: 12 }, (_, i) => item(10 + i, `Extra ${i}`, 3, 1)),
    ],
  };
});

vi.mock("~/core/config/alertas", () => ({ exibirErrosApi: mocks.exibirErrosApi }));
vi.mock("~/mocks/mockTipoEventos", () => ({ mockTipoEventos: mocks.dados }));

import { ListaPaginada } from "./ListaPaginada";

const colunas = [{ title: "Tipo", dataIndex: "descricao" }];
const ESPERA = { timeout: 4000 };

const renderizar = (props: Partial<React.ComponentProps<typeof ListaPaginada>> = {}) =>
  render(
    <ListaPaginada
      url="url"
      id="lista"
      colunaChave="id"
      colunas={colunas}
      filtro={{}}
      idsMockadosDeletados={[]}
      {...props}
    />,
  );

const linhaDe = (texto: string) => screen.getByText(texto).closest("tr") as HTMLElement;

describe("ListaPaginada (tipo-eventos)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carrega a primeira página com 10 itens e o total", async () => {
    const setLista = vi.fn();
    renderizar({ setLista });

    expect(await screen.findByText("Reunião", {}, ESPERA)).toBeTruthy();
    expect(document.querySelectorAll("tbody tr.ant-table-row")).toHaveLength(10);
    expect(setLista).toHaveBeenCalledTimes(1);
    expect(setLista.mock.calls[0][0]).toHaveLength(10);
    expect(document.querySelector(".ant-pagination-item-2")).toBeTruthy();
  });

  it("filtra por local de ocorrência, letivo e descrição (sem diferenciar maiúsculas)", async () => {
    renderizar({ filtro: { localOcorrencia: 3, letivo: 1, descricao: "FERI" } });

    expect(await screen.findByText("Feriado", {}, ESPERA)).toBeTruthy();
    expect(document.querySelectorAll("tbody tr.ant-table-row")).toHaveLength(1);
  });

  it("remove os itens com ids mockados como deletados", async () => {
    renderizar({ idsMockadosDeletados: [1, 2] });

    expect(await screen.findByText("Feriado", {}, ESPERA)).toBeTruthy();
    expect(screen.queryByText("Reunião")).toBeNull();
    expect(screen.queryByText("Prova")).toBeNull();
  });

  it("aplica mapearNovoDto aos itens carregados", async () => {
    renderizar({
      filtro: { descricao: "prova" },
      mapearNovoDto: (itens) => itens.map((i) => ({ ...i, descricao: `Mapeado ${i.descricao}` })),
    });

    expect(await screen.findByText("Mapeado Prova", {}, ESPERA)).toBeTruthy();
  });

  it("mostra 'Sem dados' e notifica lista vazia quando nada corresponde", async () => {
    const setLista = vi.fn();
    renderizar({ filtro: { descricao: "inexistente" }, setLista });

    expect(await screen.findByText("Sem dados", {}, ESPERA)).toBeTruthy();
    await waitFor(() => expect(setLista).toHaveBeenCalledWith([], []), ESPERA);
  });

  it("não carrega quando o filtro não é válido", async () => {
    vi.useFakeTimers();
    try {
      renderizar({ filtroEhValido: false });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(screen.queryByText("Reunião")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("não carrega nem exibe dados quando limparDados está ativo", async () => {
    vi.useFakeTimers();
    try {
      renderizar({ limparDados: true });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(screen.queryByText("Reunião")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("chama onClick ao clicar em uma linha", async () => {
    const onClick = vi.fn();
    renderizar({ onClick });
    await screen.findByText("Reunião", {}, ESPERA);

    fireEvent.click(screen.getByText("Prova"));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0]).toMatchObject({ id: 2 });
  });

  it("seleciona e desmarca linhas com multiSelecao, informando ids e itens", async () => {
    const onSelecionarLinhas = vi.fn();
    const selecionarItems = vi.fn();
    renderizar({ multiSelecao: true, onSelecionarLinhas, selecionarItems });
    await screen.findByText("Reunião", {}, ESPERA);

    fireEvent.click(linhaDe("Reunião").querySelector("input[type=checkbox]") as HTMLElement);
    fireEvent.click(linhaDe("Prova").querySelector("input[type=checkbox]") as HTMLElement);

    expect(onSelecionarLinhas).toHaveBeenLastCalledWith([1, 2]);
    expect(selecionarItems.mock.lastCall?.[0].map((i: { id: number }) => i.id)).toEqual([1, 2]);

    fireEvent.click(linhaDe("Reunião").querySelector("input[type=checkbox]") as HTMLElement);
    expect(onSelecionarLinhas).toHaveBeenLastCalledWith([2]);
  });

  it("desabilita o checkbox das linhas indicadas por disabledCheckboxRow", async () => {
    renderizar({
      multiSelecao: true,
      disabledCheckboxRow: (item) => item.id === 1,
    });
    await screen.findByText("Reunião", {}, ESPERA);

    expect((linhaDe("Reunião").querySelector("input[type=checkbox]") as HTMLInputElement).disabled).toBe(true);
    expect((linhaDe("Prova").querySelector("input[type=checkbox]") as HTMLInputElement).disabled).toBe(false);
  });

  it("avança para a segunda página", async () => {
    renderizar();
    await screen.findByText("Reunião", {}, ESPERA);

    fireEvent.click(document.querySelector(".ant-pagination-item-2") as HTMLElement);

    expect(await screen.findByText("Extra 10", {}, ESPERA)).toBeTruthy();
    expect(document.querySelectorAll("tbody tr.ant-table-row")).toHaveLength(5);
  });

  it("oculta a paginação quando temPaginacao é falso", async () => {
    renderizar({ temPaginacao: false });
    await screen.findByText("Reunião", {}, ESPERA);
    expect(document.querySelector(".ant-pagination")).toBeNull();
  });

  it("oculta a coluna de seleção sem multiSelecao", async () => {
    const { container } = renderizar();
    await screen.findByText("Reunião", {}, ESPERA);
    expect(container.querySelector("table")?.closest(".ocultar-coluna-multi-selecao")).toBeTruthy();
  });
});
