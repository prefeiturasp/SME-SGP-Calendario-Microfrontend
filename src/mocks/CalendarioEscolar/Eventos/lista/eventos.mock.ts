import { StatusEvento, type StatusEventoValor } from "../../../../core/constantes";
import { dresMock } from "./dres.mock";
import { tiposEventoMock } from "./tiposEvento.mock";
import type { Evento } from "./tipos";
import { uesPorDreMock } from "./ues.mock";

const FULANO = { criadoPor: "FULANO DE TAL", criadoRF: "0000001" };
const BELTRANA = { criadoPor: "BELTRANA DE TAL", criadoRF: "0000002" };
const CICLANO = { criadoPor: "CICLANO DE TAL", criadoRF: "0000003" };

type Autor = typeof FULANO;
type Dados = {
  id: number;
  calendario: number;
  nome: string;
  tipo: number;
  inicio: string; // "AAAA-MM-DD"
  fim?: string; // default = inicio
  criadoEm: string; // "AAAA-MM-DD"
  autor: Autor;
  dre?: string;
  ue?: string;
  status?: StatusEventoValor;
};

const nomeTipo = (id: number) => tiposEventoMock.find((t) => t.id === id)!.descricao;
const nomeDre = (codigo: string) => dresMock.find((d) => d.codigo === codigo)!.nome;
const nomeUe = (dre: string, codigo: string) =>
  uesPorDreMock[dre].find((u) => u.codigo === codigo)!.nome;

const evento = (d: Dados): Evento => ({
  id: d.id,
  tipoCalendarioId: d.calendario,
  nome: d.nome,
  tipoEvento: { id: d.tipo, descricao: nomeTipo(d.tipo) },
  dreId: d.dre ?? null,
  ueId: d.ue ?? null,
  ...(d.dre
    ? {
        descricaoDreUe: d.ue
          ? `${nomeDre(d.dre)} - ${nomeUe(d.dre, d.ue)}`
          : nomeDre(d.dre),
      }
    : {}),
  status: d.status ?? StatusEvento.Aprovado,
  ...d.autor,
  criadoEm: `${d.criadoEm}T09:15:00`,
  dataInicio: `${d.inicio}T00:00:00`,
  dataFim: `${d.fim ?? d.inicio}T00:00:00`,
});

// ── Calendário 1 (EFM 2025): 30 eventos ─────────────────────────────────
// 6 de rede · 8 de DRE · 16 de UE · 2 aguardando aprovação (302, 307) · 1 recusado (312)
const calendario1: Dados[] = [
  // Rede (dreId/ueId nulos)
  { id: 101, calendario: 1, nome: "Início do ano letivo 2025", tipo: 8, inicio: "2025-02-03", criadoEm: "2024-12-10", autor: FULANO },
  { id: 102, calendario: 1, nome: "Carnaval", tipo: 1, inicio: "2025-03-03", fim: "2025-03-04", criadoEm: "2024-12-10", autor: FULANO },
  { id: 103, calendario: 1, nome: "Recesso escolar de julho", tipo: 2, inicio: "2025-07-14", fim: "2025-07-25", criadoEm: "2024-12-11", autor: BELTRANA },
  { id: 104, calendario: 1, nome: "Tiradentes", tipo: 1, inicio: "2025-04-21", criadoEm: "2024-12-11", autor: BELTRANA },
  { id: 105, calendario: 1, nome: "Dia do Trabalho", tipo: 1, inicio: "2025-05-01", criadoEm: "2024-12-11", autor: BELTRANA },
  { id: 106, calendario: 1, nome: "Recesso escolar de outubro", tipo: 2, inicio: "2025-10-27", fim: "2025-11-02", criadoEm: "2024-12-12", autor: FULANO },

  // DRE
  { id: 201, calendario: 1, nome: "Formação continuada - Alfabetização", tipo: 5, inicio: "2025-04-08", criadoEm: "2025-01-20", autor: BELTRANA, dre: "100001" },
  { id: 202, calendario: 1, nome: "Encontro de diretores - 1º semestre", tipo: 6, inicio: "2025-03-12", criadoEm: "2025-01-20", autor: BELTRANA, dre: "100001" },
  { id: 203, calendario: 1, nome: "Formação de professores - Matemática", tipo: 5, inicio: "2025-08-19", criadoEm: "2025-01-21", autor: BELTRANA, dre: "100001" },
  { id: 204, calendario: 1, nome: "Formação continuada - Leitura e escrita", tipo: 5, inicio: "2025-05-06", criadoEm: "2025-01-22", autor: FULANO, dre: "100002" },
  { id: 205, calendario: 1, nome: "Encontro de diretores - 2º semestre", tipo: 6, inicio: "2025-08-13", criadoEm: "2025-01-22", autor: FULANO, dre: "100002" },
  { id: 206, calendario: 1, nome: "Formação de professores - Ciências", tipo: 5, inicio: "2025-03-31", fim: "2025-04-02", criadoEm: "2025-01-23", autor: FULANO, dre: "100002" },
  { id: 207, calendario: 1, nome: "Formação continuada - Educação inclusiva", tipo: 5, inicio: "2025-06-03", criadoEm: "2025-01-24", autor: CICLANO, dre: "100003" },
  { id: 208, calendario: 1, nome: "Encontro de diretores - fechamento", tipo: 6, inicio: "2025-11-20", criadoEm: "2025-01-24", autor: CICLANO, dre: "100003" },

  // UE
  { id: 301, calendario: 1, nome: "Reunião pedagógica do 1º bimestre", tipo: 3, inicio: "2025-03-28", criadoEm: "2025-02-05", autor: CICLANO, dre: "100001", ue: "900001" },
  { id: 302, calendario: 1, nome: "Reunião de pais - 2º bimestre", tipo: 4, inicio: "2025-06-20", criadoEm: "2025-05-02", autor: CICLANO, dre: "100002", ue: "900011", status: StatusEvento.AguardandoAprovacao },
  { id: 303, calendario: 1, nome: "Conselho de classe do 1º bimestre", tipo: 9, inicio: "2025-04-11", criadoEm: "2025-02-05", autor: CICLANO, dre: "100001", ue: "900001" },
  { id: 304, calendario: 1, nome: "Entrega de boletim do 1º bimestre", tipo: 10, inicio: "2025-04-14", criadoEm: "2025-02-06", autor: CICLANO, dre: "100001", ue: "900001" },
  { id: 305, calendario: 1, nome: "Reunião pedagógica de planejamento", tipo: 3, inicio: "2025-02-07", criadoEm: "2025-01-30", autor: BELTRANA, dre: "100001", ue: "900002" },
  { id: 306, calendario: 1, nome: "Reunião de pais - 1º bimestre", tipo: 4, inicio: "2025-04-05", criadoEm: "2025-02-10", autor: BELTRANA, dre: "100001", ue: "900002" },
  { id: 307, calendario: 1, nome: "Conselho de classe do 2º bimestre", tipo: 9, inicio: "2025-07-04", criadoEm: "2025-06-10", autor: BELTRANA, dre: "100001", ue: "900002", status: StatusEvento.AguardandoAprovacao },
  { id: 308, calendario: 1, nome: "Reunião pedagógica da educação infantil", tipo: 3, inicio: "2025-05-16", criadoEm: "2025-02-12", autor: FULANO, dre: "100001", ue: "900003" },
  { id: 309, calendario: 1, nome: "Entrega de boletim do 2º bimestre", tipo: 10, inicio: "2025-07-11", criadoEm: "2025-02-12", autor: FULANO, dre: "100001", ue: "900003" },
  { id: 310, calendario: 1, nome: "Reunião pedagógica do 2º bimestre", tipo: 3, inicio: "2025-06-13", criadoEm: "2025-02-14", autor: CICLANO, dre: "100002", ue: "900011" },
  { id: 311, calendario: 1, nome: "Conselho de classe do 3º bimestre", tipo: 9, inicio: "2025-09-26", criadoEm: "2025-02-14", autor: CICLANO, dre: "100002", ue: "900011" },
  { id: 312, calendario: 1, nome: "Reunião de pais - 3º bimestre", tipo: 4, inicio: "2025-09-12", criadoEm: "2025-02-17", autor: BELTRANA, dre: "100002", ue: "900012", status: StatusEvento.Recusado },
  { id: 313, calendario: 1, nome: "Entrega de boletim do 3º bimestre", tipo: 10, inicio: "2025-10-03", criadoEm: "2025-02-17", autor: BELTRANA, dre: "100002", ue: "900012" },
  { id: 314, calendario: 1, nome: "Reunião pedagógica do 4º bimestre", tipo: 3, inicio: "2025-11-14", criadoEm: "2025-02-18", autor: BELTRANA, dre: "100002", ue: "900012" },
  { id: 315, calendario: 1, nome: "Conselho de classe final", tipo: 9, inicio: "2025-12-12", criadoEm: "2025-02-19", autor: FULANO, dre: "100003", ue: "900021" },
  { id: 316, calendario: 1, nome: "Entrega de boletim final", tipo: 10, inicio: "2025-12-19", criadoEm: "2025-02-19", autor: FULANO, dre: "100003", ue: "900021" },
];

// ── Calendário 2 (EJA 2025): 3 · Calendário 3 (EI 2025): nenhum · Calendário 4 (EFM 2024): 2 ──
const outrosCalendarios: Dados[] = [
  { id: 401, calendario: 2, nome: "Início do semestre EJA", tipo: 8, inicio: "2025-02-10", criadoEm: "2024-12-15", autor: FULANO },
  { id: 402, calendario: 2, nome: "Recesso escolar EJA", tipo: 2, inicio: "2025-07-14", fim: "2025-07-18", criadoEm: "2024-12-15", autor: FULANO },
  { id: 403, calendario: 2, nome: "Formação continuada - EJA", tipo: 5, inicio: "2025-05-20", criadoEm: "2025-01-25", autor: BELTRANA, dre: "100001" },
  { id: 501, calendario: 4, nome: "Início do ano letivo 2024", tipo: 8, inicio: "2024-02-05", criadoEm: "2023-12-12", autor: FULANO },
  { id: 502, calendario: 4, nome: "Carnaval", tipo: 1, inicio: "2024-02-12", fim: "2024-02-13", criadoEm: "2023-12-12", autor: FULANO },
];

export const eventosMock: Evento[] = [...calendario1, ...outrosCalendarios].map(evento);
