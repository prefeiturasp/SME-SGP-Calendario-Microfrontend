import type { FormikProps } from "formik";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { Dayjs } from "dayjs";
import type { Abrangencia } from "../../../core/regras/reabertura";
import type {
  MensagemSalvar,
  TipoCalendarioDetalhe,
  TipoEventoCadastro,
} from "../../../mocks/CalendarioEscolar/Eventos/cadastro";

export type ValoresEvento = {
  id?: number;
  tipoCalendarioId: string;
  dreId: string;
  ueId: string;
  nome: string;
  tipoEventoId: string;
  feriadoId: string;
  bimestre: string[];
  dataInicio: Dayjs | "";
  dataFim: Dayjs | "";
  letivo: number;
  descricao: string;
  recorrenciaEventos: unknown | null;
};

export type CalendarioCadastro = Omit<TipoCalendarioDetalhe, "id"> & {
  id: string;
  descricaoTipoCalendario: string;
};

export const valoresIniciaisPadrao: ValoresEvento = {
  tipoCalendarioId: "",
  dreId: "",
  ueId: "",
  nome: "",
  tipoEventoId: "",
  feriadoId: "",
  bimestre: [],
  dataInicio: "",
  dataFim: "",
  letivo: 1,
  descricao: "",
  recorrenciaEventos: null,
};

type ContextoCadastro = {
  formRef: MutableRefObject<FormikProps<ValoresEvento> | null>;
  emEdicao: boolean;
  setEmEdicao: (valor: boolean) => void;
  podeAlterarEvento: boolean;
  setPodeAlterarEvento: (valor: boolean) => void;
  podeAlterarExcluir: boolean;
  setPodeAlterarExcluir: (valor: boolean) => void;
  aguardandoAprovacao: boolean;
  setAguardandoAprovacao: (valor: boolean) => void;
  somenteConsulta: boolean;
  setSomenteConsulta: (valor: boolean) => void;
  desabilitarCampos: boolean;
  setDesabilitarCampos: (valor: boolean) => void;
  exibirLoader: boolean;
  setExibirLoader: (valor: boolean) => void;
  listaTipoEvento: TipoEventoCadastro[];
  setListaTipoEvento: (lista: TipoEventoCadastro[]) => void;
  listaTipoEventoOrigem: TipoEventoCadastro[];
  setListaTipoEventoOrigem: (lista: TipoEventoCadastro[]) => void;
  listaUes: Abrangencia[];
  setListaUes: (lista: Abrangencia[]) => void;
  listaCalendarios: CalendarioCadastro[];
  setListaCalendarios: (lista: CalendarioCadastro[]) => void;
  desabilitarLetivo: boolean;
  setDesabilitarLetivo: (valor: boolean) => void;
  listaCalendarioEscolar: CalendarioCadastro[];
  setListaCalendarioEscolar: (lista: CalendarioCadastro[]) => void;
  calendariosParaCopiar: string[];
  setCalendariosParaCopiar: (ids: string[]) => void;
  exibirModalCopiar: boolean;
  setExibirModalCopiar: (valor: boolean) => void;
  mensagensCopiar: MensagemSalvar[] | null;
  setMensagensCopiar: (mensagens: MensagemSalvar[] | null) => void;
  /** Contador: muda a cada pedido do botão Cancelar para o formulário se restaurar. */
  pedidoCancelar: number;
  solicitarCancelar: () => void;
  /** Contador: muda quando o modal "Repetir" precisa descartar a recorrência. */
  pedidoLimparRecorrencia: number;
  limparRecorrencia: () => void;
};

const Contexto = createContext<ContextoCadastro | null>(null);

export const EventosCadastroProvider = ({ children }: { children: ReactNode }) => {
  const formRef = useRef<FormikProps<ValoresEvento> | null>(null);
  const [emEdicao, setEmEdicao] = useState(false);
  const [podeAlterarEvento, setPodeAlterarEvento] = useState(true);
  const [podeAlterarExcluir, setPodeAlterarExcluir] = useState(true);
  const [aguardandoAprovacao, setAguardandoAprovacao] = useState(false);
  const [somenteConsulta, setSomenteConsulta] = useState(false);
  const [desabilitarCampos, setDesabilitarCampos] = useState(false);
  const [exibirLoader, setExibirLoader] = useState(false);
  const [listaTipoEvento, setListaTipoEvento] = useState<TipoEventoCadastro[]>([]);
  const [listaTipoEventoOrigem, setListaTipoEventoOrigem] = useState<TipoEventoCadastro[]>([]);
  const [listaUes, setListaUes] = useState<Abrangencia[]>([]);
  const [listaCalendarios, setListaCalendarios] = useState<CalendarioCadastro[]>([]);
  const [desabilitarLetivo, setDesabilitarLetivo] = useState(false);
  const [listaCalendarioEscolar, setListaCalendarioEscolar] = useState<CalendarioCadastro[]>([]);
  const [calendariosParaCopiar, setCalendariosParaCopiar] = useState<string[]>([]);
  const [exibirModalCopiar, setExibirModalCopiar] = useState(false);
  const [mensagensCopiar, setMensagensCopiar] = useState<MensagemSalvar[] | null>(null);
  const [pedidoCancelar, setPedidoCancelar] = useState(0);
  const [pedidoLimparRecorrencia, setPedidoLimparRecorrencia] = useState(0);

  const solicitarCancelar = useCallback(() => setPedidoCancelar((v) => v + 1), []);
  const limparRecorrencia = useCallback(() => setPedidoLimparRecorrencia((v) => v + 1), []);

  const valor = useMemo<ContextoCadastro>(
    () => ({
      formRef,
      emEdicao,
      setEmEdicao,
      podeAlterarEvento,
      setPodeAlterarEvento,
      podeAlterarExcluir,
      setPodeAlterarExcluir,
      aguardandoAprovacao,
      setAguardandoAprovacao,
      somenteConsulta,
      setSomenteConsulta,
      desabilitarCampos,
      setDesabilitarCampos,
      exibirLoader,
      setExibirLoader,
      listaTipoEvento,
      setListaTipoEvento,
      listaTipoEventoOrigem,
      setListaTipoEventoOrigem,
      listaUes,
      setListaUes,
      listaCalendarios,
      setListaCalendarios,
      desabilitarLetivo,
      setDesabilitarLetivo,
      listaCalendarioEscolar,
      setListaCalendarioEscolar,
      calendariosParaCopiar,
      setCalendariosParaCopiar,
      exibirModalCopiar,
      setExibirModalCopiar,
      mensagensCopiar,
      setMensagensCopiar,
      pedidoCancelar,
      solicitarCancelar,
      pedidoLimparRecorrencia,
      limparRecorrencia,
    }),
    [
      emEdicao,
      podeAlterarEvento,
      podeAlterarExcluir,
      aguardandoAprovacao,
      somenteConsulta,
      desabilitarCampos,
      exibirLoader,
      listaTipoEvento,
      listaTipoEventoOrigem,
      listaUes,
      listaCalendarios,
      desabilitarLetivo,
      listaCalendarioEscolar,
      calendariosParaCopiar,
      exibirModalCopiar,
      mensagensCopiar,
      pedidoCancelar,
      solicitarCancelar,
      pedidoLimparRecorrencia,
      limparRecorrencia,
    ],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

export const useEventosCadastro = () => {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useEventosCadastro deve ser usado dentro de EventosCadastroProvider");
  return contexto;
};
