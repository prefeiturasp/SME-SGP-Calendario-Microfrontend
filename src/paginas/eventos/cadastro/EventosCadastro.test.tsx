import { configure, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EventoLetivo,
  EventoTipoData,
  LocalOcorrencia,
  StatusEvento,
} from "../../../core/constantes";
import { createMockStore } from "../../../mocks/mockStore";
import EventosCadastro from "./EventosCadastro";

vi.mock("../../../core/config/alertas", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../core/config/alertas")>()),
  confirmar: vi.fn().mockResolvedValue(true),
  sucesso: vi.fn(),
}));

vi.mock("../../../services/eventoService", () => ({
  eventoService: {
    buscarDres: vi.fn(),
    buscarUes: vi.fn(),
    obterTiposEventoCadastro: vi.fn(),
    obterPorId: vi.fn(),
    salvar: vi.fn(),
    deletar: vi.fn(),
    obterTipoCalendarioPorId: vi.fn(),
    obterTiposCalendarioPorAno: vi.fn(),
    obterBimestres: vi.fn(),
    obterFeriados: vi.fn(),
  },
}));

const { eventoService } = await import("../../../services/eventoService");
const servico = vi.mocked(eventoService);

configure({ asyncUtilTimeout: 8000 });
vi.setConfig({ testTimeout: 30000 });

const resposta = <T,>(data: T) => Promise.resolve({ data, status: 200 as const });
const calendario = {
  id: 1,
  descricao: "2025 - CALENDARIO FICTICIO DE TESTE",
  anoLetivo: 2025,
  modalidade: 1,
};

const renderizar = (rota: string) =>
  render(
    <Provider store={createMockStore()}>
      <MemoryRouter initialEntries={[rota]}>
        <EventosCadastro />
      </MemoryRouter>
    </Provider>,
  );

describe("EventosCadastro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    servico.obterTipoCalendarioPorId.mockReturnValue(resposta(calendario) as never);
    servico.buscarDres.mockReturnValue(
      resposta([
        { codigo: "100001", nome: "DRE FICTICIA UM" },
        { codigo: "100002", nome: "DRE FICTICIA DOIS" },
      ]) as never,
    );
    servico.buscarUes.mockReturnValue(
      resposta([
        { codigo: "900001", nome: "UE FICTICIA UM" },
        { codigo: "900002", nome: "UE FICTICIA DOIS" },
      ]) as never,
    );
    servico.obterTiposEventoCadastro.mockReturnValue(
      resposta({
        items: [
          {
            id: 8,
            descricao: "Tipo SME ficticio",
            localOcorrencia: LocalOcorrencia.SME,
            tipoData: EventoTipoData.Unico,
            letivo: EventoLetivo.Sim,
          },
          {
            id: 16,
            descricao: "Tipo UE ficticio",
            localOcorrencia: LocalOcorrencia.UE,
            tipoData: EventoTipoData.Unico,
            letivo: EventoLetivo.Opcional,
          },
        ],
      }) as never,
    );
  });

  it("novo: mostra calendário da rota e pré-seleciona DRE e UE 'Todas' para perfil SME", async () => {
    renderizar("/calendario-escolar/eventos/novo/1");

    expect(
      await screen.findByText("Cadastro de eventos do calendário escolar (Micro frontend)"),
    ).toBeTruthy();
    expect(await screen.findByText("2025 - CALENDARIO FICTICIO DE TESTE")).toBeTruthy();
    await waitFor(() => expect(screen.getAllByText("Todas").length).toBe(2));
    expect(servico.obterTipoCalendarioPorId).toHaveBeenCalledWith("1");
    expect(servico.obterPorId).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Alterar" })).toBeNull();
    expect(document.getElementById("SGP_BUTTON_EXCLUIR")).toBeNull();
  });

  it("novo: não salva com campos obrigatórios vazios e exibe as mensagens", async () => {
    renderizar("/calendario-escolar/eventos/novo/1");
    await waitFor(() => expect(screen.getAllByText("Todas").length).toBe(2));

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(screen.getAllByText("Campo obrigatório").length).toBeGreaterThan(0));
    expect(servico.salvar).not.toHaveBeenCalled();
  });

  it("editar: carrega o evento, mostra Alterar/Excluir e o selo de aguardando aprovação", async () => {
    servico.obterPorId.mockReturnValue(
      resposta({
        id: 5,
        nome: "Evento fictício carregado",
        descricao: "Descrição fictícia",
        tipoCalendarioId: 1,
        tipoEventoId: 8,
        dreId: null,
        ueId: null,
        dataInicio: "2025-03-03T00:00:00",
        dataFim: null,
        letivo: 1,
        feriadoId: null,
        bimestre: [],
        status: StatusEvento.AguardandoAprovacao,
        podeAlterar: true,
        podeAlterarExcluirPorPerfilAbrangencia: true,
        criadoPor: "FULANO DE TAL",
        criadoRF: "0000001",
        criadoEm: "2025-01-10T09:00:00",
        recorrenciaEventos: null,
      }) as never,
    );

    renderizar("/calendario-escolar/eventos/editar/5/1");

    expect(await screen.findByDisplayValue("Evento fictício carregado")).toBeTruthy();
    expect(servico.obterPorId).toHaveBeenCalledWith("5");
    expect(await screen.findByText("Aguardando aprovação")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Alterar" })).toBeTruthy();
    expect(document.getElementById("SGP_BUTTON_EXCLUIR")).toBeTruthy();
    expect(await screen.findByText(/INSERIDO por FULANO DE TAL/)).toBeTruthy();
  });
});
