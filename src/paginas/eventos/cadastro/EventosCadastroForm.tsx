import { faRetweet, faShare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Radio, Row } from "antd";
import type { Dayjs } from "dayjs";
import { Formik, type FormikProps } from "formik";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import * as Yup from "yup";
import { Auditoria } from "../../../componentes/ui/Auditoria";
import { Botao } from "../../../componentes/ui/Botao";
import { CampoData } from "../../../componentes/ui/CampoData";
import { CampoTexto } from "../../../componentes/ui/CampoTexto";
import { SelectCampo } from "../../../componentes/ui/SelectCampo";
import { confirmar, exibirErrosApi, sucesso } from "../../../core/config/alertas";
import {
  EventoLetivo,
  EventoTipoData,
  OPCAO_TODOS,
  ROTAS,
  StatusEvento,
  TipoEventoId,
  comoLista,
} from "../../../core/constantes";
import { paraDia } from "../../../core/datas";
import { useDestino, useRotaCalendario } from "../../../core/endereco";
import {
  paraPayloadRecorrencia,
  type RecorrenciaPayload,
} from "../../../core/regras/eventoRecorrencia";
import { definirBreadcrumbManual } from "../../../core/sessao";
import { esquemaDataObrigatoria } from "../../../core/validacao/esquemaDatas";
import type {
  EventoDetalhe,
  Feriado,
  MensagemSalvar,
  PayloadEvento,
  TipoCalendarioDetalhe,
  TipoEventoCadastro,
} from "../../../mocks/CalendarioEscolar/Eventos/cadastro";
import { eventoService } from "../../../services/eventoService";
import type { RootState } from "../../../types/redux";
import BimestreCadastroEventos from "./campos/BimestreCadastroEventos";
import DreCadastroEventos from "./campos/DreCadastroEventos";
import TipoEventoCadastroEventos from "./campos/TipoEventoCadastroEventos";
import UeCadastroEventos from "./campos/UeCadastroEventos";
import {
  useEventosCadastro,
  valoresIniciaisPadrao,
  type CalendarioCadastro,
  type ValoresEvento,
} from "./EventosCadastroContext";
import EventosModalCopiarEvento from "./EventosModalCopiarEvento";
import ModalRecorrencia from "./ModalRecorrencia";

const textoObrigatorio = "Campo obrigatório";
const TIPOS_DESCRICAO_OBRIGATORIA: string[] = [
  String(TipoEventoId.ReuniaoPedagogica),
  String(TipoEventoId.ReuniaoAPM),
  String(TipoEventoId.ReuniaoConselhoEscola),
];

const descricaoDoCalendario = (c: {
  anoLetivo?: number;
  nome?: string;
  descricaoPeriodo?: string;
  descricao: string;
}) => (c.nome && c.descricaoPeriodo ? `${c.anoLetivo} - ${c.nome} - ${c.descricaoPeriodo}` : c.descricao);

const aoFormulario = (form: FormikProps<ValoresEvento>) =>
  form as unknown as FormikProps<Record<string, unknown>>;

const EventosCadastroForm = () => {
  const navigate = useDestino();
  const { id: eventoId, tipoCalendarioId: tipoCalendarioIdRota } = useRotaCalendario();
  const { caminho } = useRotaCalendario();
  const usuario = useSelector((state: RootState) => state.usuario);
  const permissoes = usuario.permissoes?.[ROTAS.EVENTOS];
  const {
    formRef,
    emEdicao,
    setEmEdicao,
    somenteConsulta,
    desabilitarCampos,
    setDesabilitarCampos,
    podeAlterarEvento,
    setPodeAlterarEvento,
    setPodeAlterarExcluir,
    aguardandoAprovacao,
    setAguardandoAprovacao,
    listaTipoEvento,
    setListaTipoEvento,
    listaTipoEventoOrigem,
    setListaTipoEventoOrigem,
    setListaUes,
    listaCalendarios,
    setListaCalendarios,
    desabilitarLetivo,
    listaCalendarioEscolar,
    setListaCalendarioEscolar,
    calendariosParaCopiar,
    setCalendariosParaCopiar,
    setExibirModalCopiar,
    setMensagensCopiar,
    setExibirLoader,
    pedidoCancelar,
    limparRecorrencia,
  } = useEventosCadastro();

  const [valoresIniciais, setValoresIniciais] = useState<ValoresEvento | null>(
    eventoId ? null : { ...valoresIniciaisPadrao, tipoCalendarioId: tipoCalendarioIdRota ?? "" },
  );
  // Troca de chave remonta os campos e refaz os valores padrão de DRE/UE (cancelar).
  const [versaoFormulario, setVersaoFormulario] = useState(0);
  const [listaFeriados, setListaFeriados] = useState<Feriado[]>([]);
  const [desabilitarOpcaoLetivo, setDesabilitarOpcaoLetivo] = useState(true);
  const [tipoDataUnico, setTipoDataUnico] = useState(true);
  const [tipoFeriado, setTipoFeriado] = useState(false);
  const [tipoBoletim, setTipoBoletim] = useState(false);
  const [recorrencia, setRecorrencia] = useState<RecorrenciaPayload | null>(null);
  const [exibirRecorrencia, setExibirRecorrencia] = useState(false);
  const [auditoria, setAuditoria] = useState<Partial<EventoDetalhe>>({});
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear());

  const urlLista = tipoCalendarioIdRota
    ? `${ROTAS.EVENTOS}/${tipoCalendarioIdRota}`
    : ROTAS.EVENTOS;

  useEffect(() => {
    definirBreadcrumbManual(caminho, "Cadastro de eventos do calendário escolar", ROTAS.EVENTOS);
  }, [caminho]);

  useEffect(() => {
    if (aguardandoAprovacao) {
      setDesabilitarCampos(true);
      return;
    }
    setDesabilitarCampos(
      eventoId
        ? somenteConsulta || !permissoes?.podeIncluir
        : somenteConsulta || !permissoes?.podeAlterar,
    );
  }, [somenteConsulta, eventoId, permissoes, podeAlterarEvento, aguardandoAprovacao, setDesabilitarCampos]);

  const marcarEdicao = () => {
    if (!emEdicao) setEmEdicao(true);
  };

  const bloqueado = desabilitarCampos || !podeAlterarEvento;
  const calendario = listaCalendarios[0];

  // --- Regras do tipo de evento (data única/período, feriado, boletim, letivo) ---------------
  const obterFeriados = useCallback(async () => {
    try {
      const resposta = await eventoService.obterFeriados();
      setListaFeriados(comoLista<Feriado>(resposta.data));
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
      setListaFeriados([]);
    }
  }, [usuario.logado]);

  const aplicarTipoEvento = (
    tipos: TipoEventoCadastro[],
    tipoEventoId: string | number | undefined,
    form?: FormikProps<ValoresEvento>,
    idEvento?: number,
  ) => {
    if (!tipoEventoId) {
      setTipoFeriado(false);
      setTipoBoletim(false);
      return;
    }
    const tipo = tipos.find((item) => String(item.id) === String(tipoEventoId));

    if (tipo && tipo.descricao.toUpperCase() === "FERIADO") {
      setTipoFeriado(true);
      void obterFeriados();
    } else {
      setTipoFeriado(false);
      form?.setFieldValue("feriadoId", "");
    }

    let valorLetivo: number = EventoLetivo.Sim;
    let ehBoletim = false;
    let letivoDesabilitado = false;
    let dataUnica = false;

    if (tipo?.tipoData === EventoTipoData.Unico) {
      dataUnica = true;
      form?.setFieldValue("dataFim", "");
    }
    if ((form || (idEvento ?? 0) > 0) && tipo?.letivo) {
      if (tipo.letivo === EventoLetivo.Opcional) {
        letivoDesabilitado = false;
      } else {
        letivoDesabilitado = true;
        valorLetivo = tipo.letivo;
      }
    }
    if (tipo?.id === TipoEventoId.LiberacaoBoletim) {
      ehBoletim = true;
      letivoDesabilitado = true;
      dataUnica = true;
    }
    form?.setFieldValue("letivo", valorLetivo);

    setTipoBoletim(ehBoletim);
    setDesabilitarOpcaoLetivo(letivoDesabilitado);
    setTipoDataUnico(dataUnica);
  };

  // --- Carga inicial -------------------------------------------------------------------------
  const montarCalendario = useCallback(
    async (id: string | number) => {
      try {
        const resposta = await eventoService.obterTipoCalendarioPorId(id);
        const tipo = resposta.data;
        if (!tipo) {
          setListaCalendarios([]);
          return;
        }
        const completo: CalendarioCadastro = {
          ...tipo,
          id: String(tipo.id),
          descricaoTipoCalendario: descricaoDoCalendario(tipo),
        };
        if (tipo.anoLetivo) setAnoLetivo(tipo.anoLetivo);
        setListaCalendarios([completo]);
      } catch (falha) {
        exibirErrosApi(falha, usuario.logado);
        setListaCalendarios([]);
      }
    },
    [setListaCalendarios, usuario.logado],
  );

  useEffect(() => {
    if (!eventoId && tipoCalendarioIdRota) void montarCalendario(tipoCalendarioIdRota);
  }, [eventoId, tipoCalendarioIdRota, montarCalendario]);

  useEffect(() => {
    let ativo = true;
    setExibirLoader(true);

    const carregar = async () => {
      let lista: TipoEventoCadastro[] = [];
      try {
        const resposta = await eventoService.obterTiposEventoCadastro();
        lista = comoLista<TipoEventoCadastro>(resposta.data?.items);
      } catch (falha) {
        exibirErrosApi(falha, usuario.logado);
      }
      if (!ativo) return;
      setListaTipoEvento([...lista]);
      setListaTipoEventoOrigem([...lista]);

      if (!eventoId) return;
      try {
        const resposta = await eventoService.obterPorId(eventoId);
        const evento = resposta.data;
        if (!ativo || !evento) return;

        setAguardandoAprovacao(evento.status === StatusEvento.AguardandoAprovacao);
        setPodeAlterarEvento(evento.podeAlterar);
        setPodeAlterarExcluir(
          !!(
            usuario.possuiPerfilSme ||
            (usuario.possuiPerfilDre && evento.dreId) ||
            evento.criadoRF === usuario.rf ||
            evento.podeAlterarExcluirPorPerfilAbrangencia
          ),
        );
        setValoresIniciais({
          id: evento.id,
          tipoCalendarioId: String(evento.tipoCalendarioId),
          dreId: evento.dreId || OPCAO_TODOS,
          ueId: evento.ueId || OPCAO_TODOS,
          nome: evento.nome,
          tipoEventoId: String(evento.tipoEventoId),
          feriadoId: evento.feriadoId ? String(evento.feriadoId) : "",
          bimestre: (evento.bimestre ?? []).map(String),
          dataInicio: paraDia(evento.dataInicio) ?? "",
          dataFim: paraDia(evento.dataFim) ?? "",
          letivo: evento.letivo,
          descricao: evento.descricao ?? "",
          recorrenciaEventos: evento.recorrenciaEventos,
        });
        setAuditoria(evento);
        void montarCalendario(evento.tipoCalendarioId);
        const tipo = lista.find((item) => item.id === evento.tipoEventoId);
        setDesabilitarOpcaoLetivo(tipo ? tipo.letivo !== EventoLetivo.Opcional : true);
        aplicarTipoEvento(lista, evento.tipoEventoId, undefined, evento.id);
      } catch (falha) {
        exibirErrosApi(falha, usuario.logado);
      }
    };

    void carregar().finally(() => {
      if (ativo) setExibirLoader(false);
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  // --- Cancelar: volta ao estado carregado -----------------------------------------------------
  useEffect(() => {
    if (pedidoCancelar === 0) return;
    setValoresIniciais((atual) => (atual ? { ...atual } : atual));
    setVersaoFormulario((v) => v + 1);
    setEmEdicao(false);
    limparRecorrencia();
    setCalendariosParaCopiar([]);
    setListaUes([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoCancelar]);

  // --- Validação -------------------------------------------------------------------------------
  const esquema = useMemo(() => {
    const campos: Record<string, Yup.AnySchema> = {
      dreId: Yup.string().required(textoObrigatorio),
      ueId: Yup.string().required(textoObrigatorio),
      nome: Yup.string().required(textoObrigatorio),
      tipoCalendarioId: Yup.string().required(textoObrigatorio),
      tipoEventoId: Yup.string().required(textoObrigatorio),
      dataInicio: esquemaDataObrigatoria(textoObrigatorio),
      descricao: Yup.string().test("descricaoObrigatoria", textoObrigatorio, function validar() {
        const { tipoEventoId, descricao } = this.parent as ValoresEvento;
        return !(!descricao && TIPOS_DESCRICAO_OBRIGATORIA.includes(String(tipoEventoId)));
      }),
    };
    if (tipoFeriado) campos.feriadoId = Yup.string().required(textoObrigatorio);
    if (!tipoDataUnico) {
      campos.dataInicio = esquemaDataObrigatoria(textoObrigatorio).test(
        "validaInicio",
        "Data inicial maior que final",
        function validar() {
          const { dataInicio, dataFim } = this.parent as ValoresEvento;
          const inicio = paraDia(dataInicio);
          const fim = paraDia(dataFim);
          return !(inicio && fim && inicio.isAfter(fim, "day"));
        },
      );
      campos.dataFim = esquemaDataObrigatoria(textoObrigatorio);
    }
    return Yup.object(campos);
  }, [tipoFeriado, tipoDataUnico]);

  const dataForaDoAnoLetivo = (data: Dayjs) => data.year() !== anoLetivo;

  // --- Copiar evento ---------------------------------------------------------------------------
  const abrirCopiarEvento = async () => {
    try {
      const resposta = await eventoService.obterTiposCalendarioPorAno(
        usuario.turmaSelecionada?.anoLetivo ?? anoLetivo,
      );
      const lista = comoLista<TipoCalendarioDetalhe | null>(resposta.data)
        .filter((item): item is TipoCalendarioDetalhe => !!item)
        .map((item) => ({
          ...item,
          id: String(item.id),
          descricaoTipoCalendario: descricaoDoCalendario(item),
        }))
        .filter((item) => item.id !== calendario?.id);
      setListaCalendarioEscolar(lista);
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
      setListaCalendarioEscolar([]);
    }
    setExibirModalCopiar(true);
  };

  // --- Salvar ----------------------------------------------------------------------------------
  const salvar = async (valores: ValoresEvento) => {
    setExibirLoader(true);
    const inicio = paraDia(valores.dataInicio)?.startOf("day").toDate() as Date;
    const fim = tipoDataUnico ? inicio : (paraDia(valores.dataFim)?.startOf("day").toDate() ?? null);

    const tiposCalendarioParaCopiar = calendariosParaCopiar.flatMap((id) => {
      const item = listaCalendarioEscolar.find((c) => String(c.id) === id);
      return item
        ? [{ tipoCalendarioId: String(item.id), nomeCalendario: item.descricaoTipoCalendario }]
        : [];
    });

    const aoSalvar = (mensagens: MensagemSalvar[]) => {
      if (tiposCalendarioParaCopiar.length) {
        setMensagensCopiar(mensagens);
        return;
      }
      if (!recorrencia) {
        sucesso(mensagens[0]?.mensagem || "Suas informações foram salvas com sucesso.");
      } else {
        sucesso(
          `Evento ${eventoId ? "alterado" : "cadastrado"} com sucesso. Serão cadastrados eventos recorrentes, em breve você receberá uma notificação com o resultado do processamento.`,
        );
      }
      navigate(urlLista);
    };

    let payload: PayloadEvento | null = null;
    try {
      payload = {
        tipoCalendarioId: valores.tipoCalendarioId,
        nome: valores.nome,
        tipoEventoId: valores.tipoEventoId,
        letivo: valores.letivo,
        descricao: valores.descricao,
        ...(valores.feriadoId ? { feriadoId: valores.feriadoId } : {}),
        ...(valores.bimestre.length ? { bimestre: valores.bimestre } : {}),
        dataInicio: inicio,
        dataFim: fim,
        recorrenciaEventos: recorrencia ? { ...recorrencia } : null,
        tiposCalendarioParaCopiar,
        dreId: valores.dreId === OPCAO_TODOS ? "" : valores.dreId,
        ueId: valores.ueId === OPCAO_TODOS ? "" : valores.ueId,
      };

      const dataAlterada =
        !!valoresIniciais?.id &&
        paraDia(valores.dataInicio)?.valueOf() !== paraDia(valoresIniciais.dataInicio)?.valueOf();
      if (eventoId && !dataAlterada && valoresIniciais?.recorrenciaEventos) {
        const atualizarSerie = await confirmar(
          "Atualizar série",
          "",
          "Deseja também atualizar os eventos futuros pertencentes a mesma série que este?",
          "Atualizar",
          "Cancelar",
        );
        if (atualizarSerie) payload = { ...payload, AlterarARecorrenciaCompleta: true };
      }

      const resposta = await eventoService.salvar(eventoId || 0, payload);
      if (resposta.status === 200) aoSalvar(resposta.data);
    } catch (falha) {
      const resposta = (falha as { response?: { status?: number; data?: { mensagens?: string[] } } })
        .response;
      if (resposta?.status === 602 && payload) {
        const confirmou = await confirmar(
          "Confirmar data",
          "",
          resposta.data?.mensagens?.[0] ?? "Deseja confirmar a data?",
          "Sim",
          "Não",
        );
        if (confirmou) {
          const retorno = await eventoService.salvar(eventoId || 0, {
            ...payload,
            DataConfirmada: true,
          });
          if (retorno) aoSalvar(retorno.data);
        }
      } else {
        exibirErrosApi(falha, usuario.logado);
      }
    } finally {
      setExibirLoader(false);
    }
  };

  const desabilitarRepetir = (form: FormikProps<ValoresEvento>) => {
    const inicio = paraDia(form.values.dataInicio);
    const fim = paraDia(form.values.dataFim);
    return (
      bloqueado ||
      !inicio ||
      !!valoresIniciais?.id ||
      (!tipoDataUnico && !(inicio && fim && inicio.isSame(fim, "day")))
    );
  };

  if (!valoresIniciais) return null;

  const copiarSelecionados = calendariosParaCopiar
    .map((id) => listaCalendarioEscolar.find((c) => String(c.id) === id))
    .filter((c): c is CalendarioCadastro => !!c);

  return (
    <>
      <EventosModalCopiarEvento />
      <Formik
        key={versaoFormulario}
        innerRef={formRef}
        enableReinitialize
        initialValues={valoresIniciais}
        validationSchema={esquema}
        onSubmit={(valores) => void salvar(valores)}
      >
        {(form) => (
          <>
            <ModalRecorrencia
              show={exibirRecorrencia}
              dataInicioEvento={form.values.dataInicio}
              onClose={() => setExibirRecorrencia(false)}
              onSave={(valor) => {
                setRecorrencia(valor ? paraPayloadRecorrencia(valor) : null);
                if (valor) setExibirRecorrencia(false);
              }}
            />
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div className="linha-filtros-reversa">
                  <div style={{ width: "100%", maxWidth: 560 }}>
                    <SelectCampo
                      id="calendario-escolar"
                      lista={listaCalendarios}
                      valueOption="id"
                      valueText="descricaoTipoCalendario"
                      value={form.values.tipoCalendarioId}
                      disabled
                      onChange={() => undefined}
                    />
                  </div>
                  {aguardandoAprovacao && (
                    <span className="label-aguardando-aprovacao">Aguardando aprovação</span>
                  )}
                </div>
              </Col>

              <Col xs={24} xl={12}>
                <DreCadastroEventos
                  form={form}
                  eventoId={eventoId}
                  desabilitar={bloqueado}
                  onChangeCampos={() => {
                    setListaUes([]);
                    form.setFieldValue("ueId", "");
                    form.setFieldValue("tipoEventoId", "");
                    aplicarTipoEvento(listaTipoEvento, undefined);
                    marcarEdicao();
                  }}
                />
              </Col>
              <Col xs={24} xl={12}>
                <UeCadastroEventos
                  form={form}
                  eventoId={eventoId}
                  desabilitar={bloqueado}
                  onChangeCampos={() => {
                    form.setFieldValue("tipoEventoId", "");
                    limparRecorrencia();
                    setCalendariosParaCopiar([]);
                    marcarEdicao();
                  }}
                />
              </Col>

              <Col xs={24} md={12}>
                <CampoTexto
                  form={aoFormulario(form)}
                  name="nome"
                  label="Nome do evento"
                  placeholder="Nome do evento"
                  tipo="input"
                  labelRequired
                  desabilitado={bloqueado}
                  onChange={marcarEdicao}
                />
              </Col>

              <Col xs={24} md={tipoFeriado || tipoBoletim ? 6 : 12}>
                <TipoEventoCadastroEventos
                  form={form}
                  desabilitar={bloqueado}
                  onChangeCampos={(tipo) => {
                    aplicarTipoEvento(listaTipoEventoOrigem, tipo, form);
                    marcarEdicao();
                    limparRecorrencia();
                  }}
                />
              </Col>

              {tipoFeriado && (
                <Col xs={24} md={6}>
                  <SelectCampo
                    id="feriado"
                    label="Nome feriado"
                    labelRequired
                    lista={listaFeriados}
                    valueOption="id"
                    valueText="nome"
                    value={form.values.feriadoId}
                    placeholder="Selecione o feriado"
                    disabled={bloqueado}
                    erro={form.touched.feriadoId ? form.errors.feriadoId : undefined}
                    onChange={(valor) => {
                      form.setFieldValue("feriadoId", String(valor));
                      form.setFieldTouched("feriadoId", true, false);
                      marcarEdicao();
                    }}
                  />
                </Col>
              )}

              {tipoBoletim && (
                <Col xs={24} md={6}>
                  <BimestreCadastroEventos
                    form={form}
                    desabilitar={bloqueado}
                    onChangeCampos={marcarEdicao}
                  />
                </Col>
              )}

              <Col xs={24} md={12} lg={6}>
                <CampoData
                  form={aoFormulario(form)}
                  name="dataInicio"
                  label={tipoDataUnico ? "Data do evento" : "Data início do evento"}
                  placeholder="Data início do evento"
                  labelRequired
                  desabilitado={bloqueado}
                  dataDesabilitada={dataForaDoAnoLetivo}
                  onChange={marcarEdicao}
                />
              </Col>

              {!tipoDataUnico && (
                <Col xs={24} md={12} lg={6}>
                  <CampoData
                    form={aoFormulario(form)}
                    name="dataFim"
                    label="Data fim do evento"
                    placeholder="Data fim do evento"
                    labelRequired
                    desabilitado={bloqueado}
                    dataDesabilitada={dataForaDoAnoLetivo}
                    onChange={marcarEdicao}
                  />
                </Col>
              )}

              <Col xs={24} md={6} lg={4}>
                <Botao
                  id="btn-repetir"
                  label="Repetir"
                  cor="azul"
                  icone={<FontAwesomeIcon icon={faRetweet} className="" />}
                  disabled={desabilitarRepetir(form)}
                  onClick={() => setExibirRecorrencia(true)}
                />
                {!!recorrencia?.dataInicio && <small>Existe recorrência cadastrada</small>}
              </Col>

              {!desabilitarLetivo && (
                <Col xs={24} md={6}>
                  <label className="campo-label" htmlFor="letivo">
                    Letivo
                  </label>
                  <Radio.Group
                    id="letivo"
                    optionType="button"
                    value={form.values.letivo}
                    disabled={bloqueado || desabilitarOpcaoLetivo}
                    options={[
                      { label: "Sim", value: EventoLetivo.Sim },
                      { label: "Não", value: EventoLetivo.Nao },
                    ]}
                    onChange={(e) => {
                      form.setFieldValue("letivo", e.target.value);
                      marcarEdicao();
                    }}
                  />
                </Col>
              )}

              <Col span={24}>
                <CampoTexto
                  form={aoFormulario(form)}
                  name="descricao"
                  label="Descrição"
                  placeholder="Descrição"
                  labelRequired={
                    !form.values.descricao &&
                    TIPOS_DESCRICAO_OBRIGATORIA.includes(String(form.values.tipoEventoId))
                  }
                  desabilitado={bloqueado}
                  onChange={marcarEdicao}
                />
              </Col>

              <Col span={24}>
                <Botao
                  id="btn-copiar-evento"
                  label="Copiar Evento"
                  cor="azul"
                  icone={<FontAwesomeIcon icon={faShare} className="" />}
                  disabled={bloqueado}
                  onClick={() => void abrirCopiarEvento()}
                />
                {copiarSelecionados.length > 0 && (
                  <div className="lista-copiar-eventos">
                    <div>Evento será copiado para os calendários:</div>
                    {copiarSelecionados.map((item) => (
                      <div key={item.id} className="lista-copiar-item">
                        {item.descricaoTipoCalendario}
                      </div>
                    ))}
                  </div>
                )}
              </Col>

              {auditoria.criadoEm && (
                <Col span={24}>
                  <Auditoria
                    criadoEm={auditoria.criadoEm}
                    criadoPor={auditoria.criadoPor}
                    criadoRf={Number(auditoria.criadoRF) > 0 ? auditoria.criadoRF : ""}
                    alteradoPor={auditoria.alteradoPor}
                    alteradoEm={auditoria.alteradoEm}
                    alteradoRf={Number(auditoria.alteradoRF) > 0 ? auditoria.alteradoRF : ""}
                  />
                </Col>
              )}
            </Row>
          </>
        )}
      </Formik>
    </>
  );
};

export default EventosCadastroForm;
