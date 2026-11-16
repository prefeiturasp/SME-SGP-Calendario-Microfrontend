import { StatusEvento } from "../../../../core/constantes";
import { dresMock } from "../lista/dres.mock";
import {
  gravarEventoEmMemoria,
  lerEventoEmMemoria,
  proximoIdEvento,
} from "../lista/api.mock";
import { tiposCalendarioMock } from "../lista/tiposCalendario.mock";
import { tiposEventoMock } from "../lista/tiposEvento.mock";
import { uesPorDreMock } from "../lista/ues.mock";
import type { Evento } from "../lista/tipos";
import { tiposEventoCadastroMock } from "./tiposEventoCadastro.mock";
import type {
  EventoDetalhe,
  Feriado,
  MensagemSalvar,
  PayloadEvento,
  TipoCalendarioDetalhe,
} from "./tipos";

let latenciaMs = 300;
export const configurarLatenciaCadastro = (ms: number) => {
  latenciaMs = ms;
};

const clonar = <T>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T;

const esperar = <T>(valor: T) =>
  new Promise<{ data: T; status: 200 }>((resolver) => {
    setTimeout(() => resolver({ data: clonar(valor), status: 200 }), latenciaMs);
  });

const feriadosMock: Feriado[] = [
  { id: 1, nome: "Carnaval" },
  { id: 2, nome: "Tiradentes" },
  { id: 3, nome: "Dia do Trabalho" },
  { id: 4, nome: "Independência do Brasil" },
];

const NOMES_CALENDARIO: Record<number, { nome: string; descricaoPeriodo: string }> = {
  1: { nome: "EFM", descricaoPeriodo: "Anual" },
  2: { nome: "EJA", descricaoPeriodo: "Semestral" },
  3: { nome: "EI", descricaoPeriodo: "Anual" },
};

// Campos do detalhe que a listagem não guarda (descrição, letivo, feriado, bimestre…).
const extrasEmMemoria = new Map<number, Partial<EventoDetalhe>>();

const detalharCalendario = (id: number): TipoCalendarioDetalhe | null => {
  const base = tiposCalendarioMock.find((item) => item.id === id);
  if (!base) return null;
  return { ...base, ...(NOMES_CALENDARIO[base.modalidade ?? 1] ?? NOMES_CALENDARIO[1]) };
};

const tipoCadastroPorDescricao = (descricao: string) =>
  tiposEventoCadastroMock.find((tipo) => tipo.descricao === descricao) ??
  tiposEventoCadastroMock[0];

const paraDetalhe = (evento: Evento): EventoDetalhe => ({
  id: evento.id,
  nome: evento.nome,
  descricao: "",
  tipoCalendarioId: evento.tipoCalendarioId,
  tipoEventoId: tipoCadastroPorDescricao(evento.tipoEvento.descricao).id,
  dreId: evento.dreId,
  ueId: evento.ueId,
  dataInicio: evento.dataInicio,
  dataFim: evento.dataFim === evento.dataInicio ? null : evento.dataFim,
  letivo: 1,
  feriadoId: null,
  bimestre: [],
  status: evento.status,
  podeAlterar: evento.status !== StatusEvento.Recusado,
  podeAlterarExcluirPorPerfilAbrangencia: true,
  criadoPor: evento.criadoPor,
  criadoRF: evento.criadoRF,
  criadoEm: evento.criadoEm,
  recorrenciaEventos: null,
  ...extrasEmMemoria.get(evento.id),
});

const descreverDreUe = (dreId: string | null, ueId: string | null) => {
  if (!dreId) return undefined;
  const dre = dresMock.find((item) => item.codigo === dreId)?.nome;
  const ue = ueId ? uesPorDreMock[dreId]?.find((item) => item.codigo === ueId)?.nome : undefined;
  return [dre, ue].filter(Boolean).join(" - ");
};

const paraIso = (valor: Date | string | null) => {
  const data = valor ? new Date(valor) : new Date();
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}T00:00:00`;
};

const salvarUm = (
  id: number,
  payload: PayloadEvento,
  tipoCalendarioId: number,
): EventoDetalhe => {
  const existente = id ? lerEventoEmMemoria(id) : undefined;
  const novoId = existente ? id : proximoIdEvento();
  const tipoCadastro = tiposEventoCadastroMock.find((t) => t.id === Number(payload.tipoEventoId));
  const tipoLista = tiposEventoMock.find((t) => t.descricao === tipoCadastro?.descricao);
  const dreId = payload.dreId || null;
  const ueId = payload.ueId || null;
  const inicio = paraIso(payload.dataInicio);

  const evento: Evento = {
    id: novoId,
    tipoCalendarioId,
    nome: payload.nome,
    tipoEvento: {
      id: tipoLista?.id ?? tipoCadastro?.id ?? 0,
      descricao: tipoCadastro?.descricao ?? "",
    },
    dreId,
    ueId,
    descricaoDreUe: descreverDreUe(dreId, ueId),
    status: StatusEvento.Aprovado,
    criadoPor: existente?.criadoPor ?? "FULANO DE TAL",
    criadoRF: existente?.criadoRF ?? "0000001",
    criadoEm: existente?.criadoEm ?? new Date().toISOString(),
    dataInicio: inicio,
    dataFim: payload.dataFim ? paraIso(payload.dataFim) : inicio,
  };
  gravarEventoEmMemoria(evento);
  extrasEmMemoria.set(novoId, {
    descricao: payload.descricao ?? "",
    letivo: payload.letivo,
    feriadoId: payload.feriadoId ? Number(payload.feriadoId) : null,
    bimestre: (payload.bimestre ?? []).map(Number),
    dataFim: payload.dataFim ? paraIso(payload.dataFim) : null,
    ...(existente ? { alteradoPor: "FULANO DE TAL", alteradoRF: "0000001", alteradoEm: new Date().toISOString() } : {}),
  });
  return paraDetalhe(evento);
};

export const apiCadastroMock = {
  tiposEvento: () => esperar({ items: [...tiposEventoCadastroMock] }),
  tipoCalendarioPorId: (id: number) => esperar(detalharCalendario(id)),
  tiposCalendarioPorAno: (ano: number) =>
    esperar(
      tiposCalendarioMock
        .filter((item) => item.anoLetivo === ano)
        .map((item) => detalharCalendario(item.id)),
    ),
  bimestres: (tipoCalendarioId: number) => {
    const eja = tiposCalendarioMock.find((c) => c.id === tipoCalendarioId)?.modalidade === 2;
    const total = eja ? 2 : 4;
    return esperar(
      Array.from({ length: total }, (_, i) => ({ valor: i + 1, desc: `${i + 1}º Bimestre` })),
    );
  },
  feriados: () => esperar([...feriadosMock]),
  obterPorId: (id: number) => {
    const evento = lerEventoEmMemoria(id);
    return esperar(evento ? paraDetalhe(evento) : null);
  },
  salvar: (id: number, payload: PayloadEvento) => {
    salvarUm(id, payload, Number(payload.tipoCalendarioId));
    const mensagens: MensagemSalvar[] = [
      { mensagem: id ? "Evento alterado com sucesso." : "Evento cadastrado com sucesso.", sucesso: true },
    ];
    if (payload.tiposCalendarioParaCopiar.length) {
      mensagens.length = 0;
      mensagens.push({
        mensagem: `Evento ${id ? "alterado" : "cadastrado"} no calendário atual com sucesso.`,
        sucesso: true,
      });
      payload.tiposCalendarioParaCopiar.forEach((copia) => {
        salvarUm(0, payload, Number(copia.tipoCalendarioId));
        mensagens.push({
          mensagem: `Evento copiado para o calendário ${copia.nomeCalendario}.`,
          sucesso: true,
        });
      });
    }
    return esperar(mensagens);
  },
};
