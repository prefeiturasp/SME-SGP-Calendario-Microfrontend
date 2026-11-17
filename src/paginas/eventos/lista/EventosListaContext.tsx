import type { Dayjs } from "dayjs";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { TipoCalendario } from "../../../core/constantes";

type Linha = Record<string, unknown>;

type EventosListaEstado = {
  consideraHistorico: boolean;
  setConsideraHistorico: (valor: boolean) => void;
  codigoDre?: string;
  setCodigoDre: (valor?: string) => void;
  codigoUe?: string;
  setCodigoUe: (valor?: string) => void;
  calendarioSelecionado: TipoCalendario | null;
  setCalendarioSelecionado: (valor: TipoCalendario | null) => void;
  tipoEventoSelecionado: string;
  setTipoEventoSelecionado: (valor: string) => void;
  nomeEvento: string;
  setNomeEvento: (valor: string) => void;
  dataInicio: Dayjs | null;
  setDataInicio: (valor: Dayjs | null) => void;
  dataFim: Dayjs | null;
  setDataFim: (valor: Dayjs | null) => void;
  ehEventosTodaRede: boolean;
  setEhEventosTodaRede: (valor: boolean) => void;
  eventosSelecionados: Linha[];
  setEventosSelecionados: (valor: Linha[]) => void;
  /** Sinaliza que os filtros mudaram e a lista deve ser consultada de novo. */
  filtrarNovaConsulta: boolean;
  setFiltrarNovaConsulta: (valor: boolean) => void;
  /** Incrementa para reconsultar com o mesmo filtro (ex.: após excluir). */
  versaoLista: number;
  recarregarLista: () => void;
  exibirLoader: boolean;
  setExibirLoader: (valor: boolean) => void;
};

const EventosListaContext = createContext<EventosListaEstado | null>(null);

export const EventosListaProvider = ({ children }: { children: ReactNode }) => {
  const [consideraHistorico, setConsideraHistorico] = useState(false);
  const [codigoDre, setCodigoDre] = useState<string>();
  const [codigoUe, setCodigoUe] = useState<string>();
  const [calendarioSelecionado, setCalendarioSelecionado] = useState<TipoCalendario | null>(null);
  const [tipoEventoSelecionado, setTipoEventoSelecionado] = useState("");
  const [nomeEvento, setNomeEvento] = useState("");
  const [dataInicio, setDataInicio] = useState<Dayjs | null>(null);
  const [dataFim, setDataFim] = useState<Dayjs | null>(null);
  const [ehEventosTodaRede, setEhEventosTodaRede] = useState(false);
  const [eventosSelecionados, setEventosSelecionados] = useState<Linha[]>([]);
  const [filtrarNovaConsulta, setFiltrarNovaConsulta] = useState(false);
  const [versaoLista, setVersaoLista] = useState(0);
  const [exibirLoader, setExibirLoader] = useState(false);

  const valor = useMemo<EventosListaEstado>(
    () => ({
      consideraHistorico,
      setConsideraHistorico,
      codigoDre,
      setCodigoDre,
      codigoUe,
      setCodigoUe,
      calendarioSelecionado,
      setCalendarioSelecionado,
      tipoEventoSelecionado,
      setTipoEventoSelecionado,
      nomeEvento,
      setNomeEvento,
      dataInicio,
      setDataInicio,
      dataFim,
      setDataFim,
      ehEventosTodaRede,
      setEhEventosTodaRede,
      eventosSelecionados,
      setEventosSelecionados,
      filtrarNovaConsulta,
      setFiltrarNovaConsulta,
      versaoLista,
      recarregarLista: () => setVersaoLista((versao) => versao + 1),
      exibirLoader,
      setExibirLoader,
    }),
    [
      consideraHistorico,
      codigoDre,
      codigoUe,
      calendarioSelecionado,
      tipoEventoSelecionado,
      nomeEvento,
      dataInicio,
      dataFim,
      ehEventosTodaRede,
      eventosSelecionados,
      filtrarNovaConsulta,
      versaoLista,
      exibirLoader,
    ],
  );

  return <EventosListaContext.Provider value={valor}>{children}</EventosListaContext.Provider>;
};

export const useEventosLista = () => {
  const contexto = useContext(EventosListaContext);
  if (!contexto) {
    throw new Error("useEventosLista deve ser usado dentro de EventosListaProvider");
  }
  return contexto;
};
