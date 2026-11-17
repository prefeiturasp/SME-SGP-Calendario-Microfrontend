import type {
  LocalOcorrenciaValor,
  StatusEventoValor,
  TipoCalendario,
} from "../../../../core/constantes";

/** Tipo de evento como o cadastro o recebe (`tipos/listar?ehCadastro=true`). */
export type TipoEventoCadastro = {
  id: number;
  descricao: string;
  localOcorrencia: LocalOcorrenciaValor;
  tipoData: number; // EventoTipoData
  letivo: number; // EventoLetivo
};

export type TipoCalendarioDetalhe = TipoCalendario & {
  nome?: string;
  descricaoPeriodo?: string;
};

export type Feriado = { id: number; nome: string };
export type Bimestre = { valor: number; desc: string };

export type EventoDetalhe = {
  id: number;
  nome: string;
  descricao: string;
  tipoCalendarioId: number;
  tipoEventoId: number;
  dreId: string | null;
  ueId: string | null;
  dataInicio: string; // ISO
  dataFim: string | null; // ISO
  letivo: number;
  feriadoId: number | null;
  bimestre: number[];
  status: StatusEventoValor;
  podeAlterar: boolean;
  podeAlterarExcluirPorPerfilAbrangencia: boolean;
  criadoPor: string;
  criadoRF: string;
  criadoEm: string;
  alteradoPor?: string;
  alteradoRF?: string;
  alteradoEm?: string;
  recorrenciaEventos: unknown | null;
};

/** Corpo enviado em POST/PUT `v1/calendarios/eventos`. */
export type PayloadEvento = {
  tipoCalendarioId: string;
  dreId: string;
  ueId: string;
  nome: string;
  tipoEventoId: string;
  feriadoId?: string;
  bimestre?: string[];
  dataInicio: Date;
  dataFim: Date | null;
  letivo: number;
  descricao?: string;
  recorrenciaEventos: unknown | null;
  tiposCalendarioParaCopiar: { tipoCalendarioId: string; nomeCalendario: string }[];
  AlterarARecorrenciaCompleta?: boolean;
  DataConfirmada?: boolean;
};

export type MensagemSalvar = { mensagem: string; sucesso: boolean };
