import type { LocalOcorrenciaValor, StatusEventoValor } from "../../../../core/constantes";

export type TipoEvento = {
  id: number;
  descricao: string;
  localOcorrencia: LocalOcorrenciaValor;
};

export type Evento = {
  id: number;
  tipoCalendarioId: number;
  nome: string;
  tipoEvento: { id: number; descricao: string };
  dreId: string | null; // null = evento de rede (sem DRE)
  ueId: string | null;
  descricaoDreUe?: string; // 2ª linha da coluna "Nome do evento"
  status: StatusEventoValor;
  criadoPor: string;
  criadoRF: string;
  criadoEm: string; // ISO
  dataInicio: string; // ISO
  dataFim: string; // ISO
};

export type Paginado<T> = { items: T[]; totalRegistros: number };
export type OpcaoAbrangencia = { codigo: string; nome: string };
