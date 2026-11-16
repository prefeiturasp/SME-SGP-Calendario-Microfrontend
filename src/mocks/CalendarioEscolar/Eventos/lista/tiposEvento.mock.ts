import { LocalOcorrencia } from "../../../../core/constantes";
import type { TipoEvento } from "./tipos";

export const tiposEventoMock: TipoEvento[] = [
  { id: 1, descricao: "Feriado", localOcorrencia: LocalOcorrencia.TODOS },
  { id: 2, descricao: "Recesso escolar", localOcorrencia: LocalOcorrencia.TODOS },
  { id: 3, descricao: "Reunião pedagógica", localOcorrencia: LocalOcorrencia.UE },
  { id: 4, descricao: "Reunião de pais e responsáveis", localOcorrencia: LocalOcorrencia.UE },
  { id: 5, descricao: "Formação de professores", localOcorrencia: LocalOcorrencia.DRE },
  { id: 6, descricao: "Encontro de diretores", localOcorrencia: LocalOcorrencia.DRE },
  { id: 7, descricao: "Suspensão de atividades", localOcorrencia: LocalOcorrencia.SME },
  { id: 8, descricao: "Início do ano letivo", localOcorrencia: LocalOcorrencia.SME },
  { id: 9, descricao: "Conselho de classe", localOcorrencia: LocalOcorrencia.SMEUE },
  { id: 10, descricao: "Entrega de boletim", localOcorrencia: LocalOcorrencia.SMEUE },
];
