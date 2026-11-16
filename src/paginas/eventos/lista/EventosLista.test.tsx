import { configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StatusEvento } from "../../../core/constantes";
import { createMockStore } from "../../../mocks/mockStore";
import EventosLista from "./EventosLista";

vi.mock("../../../core/config/alertas", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../core/config/alertas")>()),
  confirmar: vi.fn().mockResolvedValue(true),
  sucesso: vi.fn(),
}));

vi.mock("../../../services/eventoService", () => ({
  eventoService: {
    obterTiposCalendario: vi.fn(),
    buscarDres: vi.fn(),
    buscarUes: vi.fn(),
    obterTiposEvento: vi.fn(),
    listar: vi.fn(),
    deletar: vi.fn(),
  },
}));

const { eventoService } = await import("../../../services/eventoService");
const servico = vi.mocked(eventoService);

// antd em jsdom é lento: folga para findBy/waitFor e para o timeout do teste.
configure({ asyncUtilTimeout: 8000 });
vi.setConfig({ testTimeout: 30000 });

const CALENDARIO = "2025 - CALENDARIO FICTICIO DE TESTE";
const eventos = [
  {
    id: 1,
    nome: "Evento fictício A",
    status: StatusEvento.AguardandoAprovacao,
    tipoEvento: { id: 8, descricao: "Tipo SME" },
    descricaoDreUe: "DRE FICTICIA - UE FICTICIA",
    criadoPor: "FULANO DE TAL",
    criadoRF: "0000001",
    criadoEm: "2025-01-10T09:00:00",
    dataInicio: "2025-02-03T00:00:00",
    dataFim: "2025-02-04T00:00:00",
  },
  {
    id: 2,
    nome: "Evento fictício B",
    status: StatusEvento.Aprovado,
    tipoEvento: { id: 1, descricao: "Tipo Todos" },
    criadoPor: "BELTRANA DE TAL",
    criadoRF: "0000002",
    criadoEm: "2025-01-11T09:00:00",
    dataInicio: "2025-03-03T00:00:00",
    dataFim: "2025-03-03T00:00:00",
  },
];

const resposta = <T,>(data: T) => Promise.resolve({ data, status: 200 as const });

const renderizar = () =>
  render(
    <Provider store={createMockStore()}>
      <MemoryRouter>
        <EventosLista />
      </MemoryRouter>
    </Provider>,
  );

const escolherCalendario = async () => {
  const campo = await waitFor(() => {
    const encontrado = document.getElementById("SGP_SELECT_TIPO_CALENDARIO");
    if (!encontrado) throw new Error("campo de calendário ausente");
    return encontrado;
  });
  fireEvent.mouseDown(campo);
  const opcoes = await screen.findAllByText(CALENDARIO);
  fireEvent.click(opcoes[opcoes.length - 1]);
};

describe("EventosLista", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    servico.obterTiposCalendario.mockImplementation(() =>
      resposta([{ id: 1, descricao: CALENDARIO, modalidade: 1, anoLetivo: 2025 }]) as never,
    );
    servico.buscarDres.mockImplementation(() =>
      resposta([
        { codigo: "100001", nome: "DRE FICTICIA A" },
        { codigo: "100002", nome: "DRE FICTICIA B" },
      ]) as never,
    );
    servico.buscarUes.mockImplementation(() =>
      resposta([
        { codigo: "900001", nome: "UE FICTICIA A" },
        { codigo: "900002", nome: "UE FICTICIA B" },
      ]) as never,
    );
    servico.obterTiposEvento.mockImplementation(
      () =>
        resposta({
          items: [
            { id: 1, descricao: "Tipo Todos", localOcorrencia: 5 },
            { id: 3, descricao: "Tipo UE", localOcorrencia: 1 },
            { id: 5, descricao: "Tipo DRE", localOcorrencia: 2 },
            { id: 8, descricao: "Tipo SME", localOcorrencia: 3 },
          ],
        }) as never,
    );
    servico.listar.mockImplementation(
      () => resposta({ items: eventos, totalRegistros: eventos.length }) as never,
    );
    servico.deletar.mockImplementation(() => resposta([1]) as never);
  });

  it("sem calendário mostra o alerta, desabilita os campos e não renderiza a tabela", async () => {
    renderizar();
    expect(
      await screen.findByText(
        "Para cadastrar ou listar eventos você precisa selecionar um tipo de calendário",
      ),
    ).toBeTruthy();
    expect(
      (screen.getByPlaceholderText("Pesquise o evento pelo nome") as HTMLInputElement).disabled,
    ).toBe(true);
    expect(screen.queryByRole("table")).toBeNull();
    expect((screen.getByRole("button", { name: "Novo" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("ao escolher o calendário lista com as 5 colunas e Todas pré-selecionadas", async () => {
    renderizar();
    await escolherCalendario();

    expect(await screen.findByText("Evento fictício B")).toBeTruthy();
    for (const titulo of [
      "Nome do evento",
      "Tipo de evento",
      "Cadastrado por",
      "Data do cadastro",
      "Data início e fim",
    ]) {
      expect(screen.getAllByText(titulo).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText("Todas").length).toBe(2); // DRE e UE
    expect(screen.getByText("BELTRANA DE TAL (0000002)")).toBeTruthy();
    expect(screen.getByText("03/03/2025 - 03/03/2025")).toBeTruthy();
    expect(servico.listar).toHaveBeenCalledWith(
      1,
      10,
      expect.objectContaining({ tipoCalendarioId: 1, ehTodasDres: true, ehTodasUes: true }),
    );
  });

  it("marca evento aguardando aprovação e mostra a 2ª linha DRE/UE", async () => {
    renderizar();
    await escolherCalendario();
    expect(await screen.findByText("Evento fictício A (Aguardando aprovação)")).toBeTruthy();
    expect(screen.getByText("DRE FICTICIA - UE FICTICIA")).toBeTruthy();
  });

  it("com DRE/UE Todas não oferece tipos de local UE ou DRE", async () => {
    renderizar();
    await escolherCalendario();
    await screen.findByText("Evento fictício B");

    fireEvent.mouseDown(screen.getByLabelText("Tipo de evento"));
    const lista = await screen.findAllByText("Tipo SME");
    expect(lista.length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tipo Todos").length).toBeGreaterThan(0);
    expect(screen.queryByText("Tipo UE")).toBeNull();
    expect(screen.queryByText("Tipo DRE")).toBeNull();
  });

  it("data início sem fim mostra erro e não reconsulta", async () => {
    renderizar();
    await escolherCalendario();
    await screen.findByText("Evento fictício B");
    const chamadas = servico.listar.mock.calls.length;

    const campo = screen.getByPlaceholderText("Data início");
    await userEvent.type(campo, "10/03/2025");
    fireEvent.keyDown(campo, { key: "Enter", code: "Enter", keyCode: 13 });
    fireEvent.blur(campo);

    expect(await screen.findByText("Data obrigatória")).toBeTruthy();
    expect(servico.listar.mock.calls.length).toBe(chamadas);
  });

  it("exibe o switch de rede apenas com DRE e UE Todas e perfil SME", async () => {
    renderizar();
    expect(screen.queryByText("Exibir somente eventos válidos para toda a rede")).toBeNull();
    await escolherCalendario();
    expect(
      await screen.findByText("Exibir somente eventos válidos para toda a rede"),
    ).toBeTruthy();
  });

  it("Excluir fica desabilitado sem seleção; com seleção confirma e chama deletar", async () => {
    renderizar();
    await escolherCalendario();
    await screen.findByText("Evento fictício B");

    // o botão é recriado pelo Tooltip ao mudar de estado: reconsultar a cada uso
    const botaoExcluir = () => screen.getByRole("button", { name: /excluir/i }) as HTMLButtonElement;
    expect(botaoExcluir().disabled).toBe(true);

    fireEvent.click(within(screen.getByRole("table")).getAllByRole("checkbox")[1]); // [0] seleciona todos
    await waitFor(() => expect(botaoExcluir().disabled).toBe(false));

    fireEvent.click(botaoExcluir());


    await waitFor(() => expect(servico.deletar).toHaveBeenCalledWith([1]));
  });
});
