import {
  EventoLetivo,
  EventoTipoData,
  LocalOcorrencia,
  TipoEventoId,
} from "../../../../core/constantes";
import type { TipoEventoCadastro } from "./tipos";

const { Unico, InicioFim } = EventoTipoData;
const { Sim, Nao, Opcional } = EventoLetivo;

// Ids seguem o enum de tipos de evento do SGP (a regra de Feriado, Reunião e Boletim depende deles).
export const tiposEventoCadastroMock: TipoEventoCadastro[] = [
  { id: 1, descricao: "Conselho de classe", localOcorrencia: LocalOcorrencia.SMEUE, tipoData: InicioFim, letivo: Sim },
  { id: TipoEventoId.Feriado, descricao: "Feriado", localOcorrencia: LocalOcorrencia.TODOS, tipoData: Unico, letivo: Nao },
  { id: 8, descricao: "Início do ano letivo", localOcorrencia: LocalOcorrencia.SME, tipoData: Unico, letivo: Sim },
  { id: 11, descricao: "Recesso escolar", localOcorrencia: LocalOcorrencia.TODOS, tipoData: InicioFim, letivo: Nao },
  { id: TipoEventoId.LiberacaoBoletim, descricao: "Entrega de boletim", localOcorrencia: LocalOcorrencia.SMEUE, tipoData: Unico, letivo: Sim },
  { id: TipoEventoId.ReuniaoPedagogica, descricao: "Reunião pedagógica", localOcorrencia: LocalOcorrencia.UE, tipoData: Unico, letivo: Opcional },
  { id: TipoEventoId.ReuniaoAPM, descricao: "Reunião de APM", localOcorrencia: LocalOcorrencia.UE, tipoData: Unico, letivo: Opcional },
  { id: TipoEventoId.ReuniaoConselhoEscola, descricao: "Reunião do conselho de escola", localOcorrencia: LocalOcorrencia.UE, tipoData: Unico, letivo: Opcional },
  { id: 19, descricao: "Reunião de pais e responsáveis", localOcorrencia: LocalOcorrencia.UE, tipoData: Unico, letivo: Opcional },
  { id: 21, descricao: "Suspensão de atividades", localOcorrencia: LocalOcorrencia.SME, tipoData: InicioFim, letivo: Nao },
  { id: 22, descricao: "Formação de professores", localOcorrencia: LocalOcorrencia.DRE, tipoData: InicioFim, letivo: Opcional },
  { id: 24, descricao: "Encontro de diretores", localOcorrencia: LocalOcorrencia.DRE, tipoData: Unico, letivo: Sim },
  { id: TipoEventoId.ItineranciaPAAI, descricao: "Itinerância PAAI", localOcorrencia: LocalOcorrencia.UE, tipoData: Unico, letivo: Opcional },
];
