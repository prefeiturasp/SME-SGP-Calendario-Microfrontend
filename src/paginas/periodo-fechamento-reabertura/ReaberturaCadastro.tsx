import { Col, Row } from "antd";
import { Formik, type FormikProps } from "formik";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useDestino, useRotaCalendario } from "../../core/endereco";
import * as Yup from "yup";
import { Auditoria } from "../../componentes/ui/Auditoria";
import { Botao, BotaoExcluir, BotaoVoltar } from "../../componentes/ui/Botao";
import { Cabecalho } from "../../componentes/ui/Cabecalho";
import { CampoData } from "../../componentes/ui/CampoData";
import { CampoTexto } from "../../componentes/ui/CampoTexto";
import { Loader } from "../../componentes/ui/Loader";
import { SelectAutocomplete } from "../../componentes/ui/SelectAutocomplete";
import { SelectCampo } from "../../componentes/ui/SelectCampo";
import { confirmar, exibirErrosApi, mensagemApi, sucesso } from "../../core/config/alertas";
import { OPCAO_TODOS, ROTAS, comoLista, ehEjaOuCelp, type TipoCalendario } from "../../core/constantes";
import { formatarUtc, paraDataApi, paraDia, type ValorData } from "../../core/datas";
import {
  bimestresMarcados,
  bimestresParaSalvar,
  mesclarAbrangencias,
  montarListaBimestres,
  onchangeMultiSelect,
  ordenarPorNome,
  type Abrangencia,
} from "../../core/regras/reabertura";
import { definirBreadcrumbManual, verificaSomenteConsulta } from "../../core/sessao";
import { esquemaDataObrigatoria } from "../../core/validacao/esquemaDatas";
import { abrangenciaService } from "../../services/abrangenciaService";
import { calendarioService } from "../../services/calendarioService";
import {
  fechamentoReaberturaService,
  type ReaberturaDetalhe,
} from "../../services/fechamentoReaberturaService";
import type { RootState } from "../../types/redux";

type Valores = {
  tipoCalendarioId: string;
  dreCodigo: string;
  ueCodigo: string;
  dataInicio: ValorData;
  dataFim: ValorData;
  descricao: string;
  bimestres: string[];
};

const textoObrigatorio = "Campo obrigatório";

const esquema = Yup.object({
  descricao: Yup.string().required(textoObrigatorio),
  dataInicio: esquemaDataObrigatoria(textoObrigatorio).test(
    "validaInicio",
    "Data inicial maior que final",
    function validar(valor) {
      const inicio = paraDia(valor as ValorData);
      const fim = paraDia(this.parent.dataFim);
      if (inicio && fim && inicio.isAfter(fim, "day")) return false;
      return true;
    },
  ),
  dataFim: esquemaDataObrigatoria(textoObrigatorio),
  bimestres: Yup.array().of(Yup.string().required()).min(1, textoObrigatorio),
  dreCodigo: Yup.string().required(textoObrigatorio),
  ueCodigo: Yup.string().required(textoObrigatorio),
});

const valoresPadrao = (tipoCalendarioId = ""): Valores => ({
  tipoCalendarioId,
  dreCodigo: "",
  ueCodigo: "",
  dataInicio: "",
  dataFim: "",
  descricao: "",
  bimestres: [],
});

const ReaberturaCadastro = () => {
  const navigate = useDestino();
  const { caminho, id, tipoCalendarioId } = useRotaCalendario();
  const params = { id, tipoCalendarioId };
  const usuario = useSelector((state: RootState) => state.usuario);
  const permissoes = usuario.permissoes?.[ROTAS.PERIODO_FECHAMENTO_REABERTURA];
  const formRef = useRef<FormikProps<Valores> | null>(null);
  const novo = !params.id;
  const [somenteConsulta, setSomenteConsulta] = useState(false);
  const [emEdicao, setEmEdicao] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [carregandoCalendarios, setCarregandoCalendarios] = useState(false);
  const [carregandoDres, setCarregandoDres] = useState(false);
  const [carregandoUes, setCarregandoUes] = useState(false);
  const [calendarios, setCalendarios] = useState<TipoCalendario[]>([]);
  const [calendario, setCalendario] = useState<TipoCalendario | null>(null);
  const [dres, setDres] = useState<Abrangencia[]>([]);
  const [ues, setUes] = useState<Abrangencia[]>([]);
  const [dreCodigo, setDreCodigo] = useState("");
  const [valores, setValores] = useState<Valores | null>(
    novo ? valoresPadrao(params.tipoCalendarioId) : null,
  );
  const [auditoria, setAuditoria] = useState<Partial<ReaberturaDetalhe>>({});
  const [aprovacao, setAprovacao] = useState("");

  const desabilitarCampos = novo
    ? somenteConsulta || !permissoes?.podeIncluir
    : somenteConsulta || !permissoes?.podeAlterar;
  const listaBimestres = useMemo(
    () => (calendario?.modalidade ? montarListaBimestres(ehEjaOuCelp(calendario.modalidade)) : []),
    [calendario?.modalidade],
  );

  useEffect(() => {
    setSomenteConsulta(verificaSomenteConsulta(permissoes));
  }, [permissoes]);

  useEffect(() => {
    definirBreadcrumbManual(caminho, "Períodos", ROTAS.PERIODO_FECHAMENTO_REABERTURA);
  }, [caminho]);

  const buscarCalendarios = useCallback(
    async (descricao = "") => {
      setCarregandoCalendarios(true);
      try {
        const resposta = await calendarioService.obterTiposCalendarioAutoComplete(descricao);
        setCalendarios(comoLista<TipoCalendario>(resposta.data));
      } catch (falha) {
        exibirErrosApi(falha, usuario.logado);
        setCalendarios([]);
      } finally {
        setCarregandoCalendarios(false);
      }
    },
    [usuario.logado],
  );

  useEffect(() => {
    void buscarCalendarios();
  }, [buscarCalendarios]);

  useEffect(() => {
    if (!params.tipoCalendarioId || !calendarios.length || params.id) return;
    const atual = calendarios.find((item) => String(item.id) === String(params.tipoCalendarioId));
    if (atual) setCalendario(atual);
  }, [params.tipoCalendarioId, params.id, calendarios]);

  useEffect(() => {
    if (!params.id || !calendarios.length) return;
    let ativo = true;
    setProcessando(true);
    fechamentoReaberturaService
      .obterPorId(params.id)
      .then((resposta) => {
        if (!ativo || !resposta.data?.id) return;
        const dados = resposta.data;
        const calendarioAtual = calendarios.find((item) => item.id === dados.tipoCalendarioId);
        if (calendarioAtual) setCalendario(calendarioAtual);
        const diaAprovacao = dados.aprovadoEm ? formatarUtc(dados.aprovadoEm) : null;
        setAprovacao(
          diaAprovacao && dados.aprovadoPor
            ? `Aprovado por ${dados.aprovadoPor} em ${diaAprovacao.format("DD/MM/YYYY")}  às ${diaAprovacao.format("HH:mm")}`
            : "",
        );
        setAuditoria(dados);
        setDreCodigo(dados.dreCodigo || OPCAO_TODOS);
        setValores({
          tipoCalendarioId: String(dados.tipoCalendarioId),
          dreCodigo: dados.dreCodigo || OPCAO_TODOS,
          ueCodigo: dados.ueCodigo || OPCAO_TODOS,
          dataInicio: paraDia(dados.dataInicio) || "",
          dataFim: paraDia(dados.dataFim) || "",
          descricao: dados.descricao,
          bimestres: bimestresMarcados(dados.bimestres).map(String),
        });
      })
      .catch((falha) => exibirErrosApi(falha, usuario.logado))
      .finally(() => {
        if (ativo) setProcessando(false);
      });
    return () => {
      ativo = false;
    };
  }, [params.id, calendarios, usuario.logado]);

  useEffect(() => {
    if (params.id && !dreCodigo) return;
    let ativo = true;
    setCarregandoDres(true);
    abrangenciaService
      .buscarDres()
      .then((resposta) => {
        if (!ativo) return;
        const lista = comoLista<Abrangencia>(resposta.data).sort(ordenarPorNome("nome"));
        if (lista.length === 1 && novo) {
          const codigo = lista[0].codigo || "";
          setDreCodigo(codigo);
          formRef.current?.setFieldValue("dreCodigo", codigo);
        }
        if (usuario.possuiPerfilSme && lista.length > 1) {
          lista.unshift({ codigo: OPCAO_TODOS, nome: "Todas" });
          if (novo) {
            setDreCodigo(OPCAO_TODOS);
            formRef.current?.setFieldValue("dreCodigo", OPCAO_TODOS);
          }
        } else if (!novo && dreCodigo === OPCAO_TODOS) {
          lista.unshift({ codigo: OPCAO_TODOS, nome: "Todas" });
        }
        setDres(lista);
      })
      .catch((falha) => exibirErrosApi(falha, usuario.logado))
      .finally(() => {
        if (ativo) setCarregandoDres(false);
      });
    return () => {
      ativo = false;
    };
  }, [params.id, dreCodigo, novo, usuario.possuiPerfilSme, usuario.logado]);

  useEffect(() => {
    if (!dreCodigo) {
      setUes([]);
      return;
    }
    if (dreCodigo === OPCAO_TODOS) {
      setUes([{ codigo: OPCAO_TODOS, nome: "Todas" }]);
      formRef.current?.setFieldValue("ueCodigo", OPCAO_TODOS);
      return;
    }
    if (!calendario?.id) {
      setUes([]);
      return;
    }
    let ativo = true;
    const modalidade = calendarioService.converterModalidade(calendario.modalidade);
    setCarregandoUes(true);
    Promise.all([
      abrangenciaService.buscarUes(dreCodigo, modalidade, false, calendario.anoLetivo),
      abrangenciaService.buscarUes(dreCodigo, modalidade, true, calendario.anoLetivo),
    ])
      .then(([atuais, historicas]) => {
        if (!ativo) return;
        const lista = mesclarAbrangencias(atuais.data, historicas.data).sort(ordenarPorNome("nome"));
        if (lista.length === 1) {
          const codigo = lista[0].codigo || "";
          formRef.current?.setFieldValue("ueCodigo", codigo);
        }
        setUes(lista);
      })
      .catch((falha) => {
        exibirErrosApi(falha, usuario.logado);
        setUes([]);
      })
      .finally(() => {
        if (ativo) setCarregandoUes(false);
      });
    return () => {
      ativo = false;
    };
  }, [dreCodigo, calendario, usuario.logado]);

  const marcarEdicao = () => {
    if (!desabilitarCampos) setEmEdicao(true);
  };

  const salvar = async (dados: Valores) => {
    setProcessando(true);
    try {
      const retorno = await fechamentoReaberturaService.salvar({
        bimestres: bimestresParaSalvar(dados.bimestres, listaBimestres),
        descricao: dados.descricao,
        ueCodigo: dados.ueCodigo === OPCAO_TODOS ? "" : dados.ueCodigo,
        dreCodigo: dados.dreCodigo === OPCAO_TODOS ? "" : dados.dreCodigo,
        fim: paraDataApi(dados.dataFim),
        inicio: paraDataApi(dados.dataInicio),
        tipoCalendarioId: calendario?.id,
        ...(params.id ? { id: params.id } : {}),
      });
      if (retorno.status === 200) {
        sucesso(mensagemApi(retorno.data, "Suas informações foram salvas com sucesso."));
        navigate(ROTAS.PERIODO_FECHAMENTO_REABERTURA);
      }
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
    } finally {
      setProcessando(false);
    }
  };

  const validarESalvar = async () => {
    const form = formRef.current;
    if (!form) return;
    setEmEdicao(true);
    Object.keys(valoresPadrao()).forEach((campo) => form.setFieldTouched(campo, true, false));
    const erros = await form.validateForm();
    if (Object.keys(erros).length === 0) await salvar(form.values);
  };

  const voltar = async () => {
    if (!emEdicao) {
      navigate(ROTAS.PERIODO_FECHAMENTO_REABERTURA);
      return;
    }
    const confirmou = await confirmar(
      "Atenção",
      "",
      "Suas alterações não foram salvas, deseja salvar agora?",
    );
    if (confirmou) await validarESalvar();
    else navigate(ROTAS.PERIODO_FECHAMENTO_REABERTURA);
  };

  const cancelar = async () => {
    if (!emEdicao) return;
    const confirmou = await confirmar(
      "Atenção",
      "Você não salvou as informações preenchidas.",
      "Deseja realmente cancelar as alterações?",
    );
    if (!confirmou) return;
    formRef.current?.resetForm();
    setEmEdicao(false);
    if (params.tipoCalendarioId) {
      const atual = calendarios.find((item) => String(item.id) === String(params.tipoCalendarioId));
      setCalendario(atual || null);
    } else if (novo) {
      setCalendario(null);
    }
  };

  const excluir = async () => {
    if (novo || !params.id) return;
    const confirmou = await confirmar(
      "Excluir Fechamento",
      "",
      "Deseja realmente excluir este fechamento?",
      "Excluir",
      "Cancelar",
    );
    if (!confirmou) return;
    setProcessando(true);
    try {
      const resposta = await fechamentoReaberturaService.deletar([params.id]);
      if (resposta.status === 200) {
        sucesso(mensagemApi(resposta.data, "Registro excluído com sucesso."));
        navigate(ROTAS.PERIODO_FECHAMENTO_REABERTURA);
      }
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Loader loading={processando}>
      <Cabecalho pagina="Período de Fechamento (Reabertura) (Micro frontend)">
        <BotaoVoltar onClick={() => void voltar()} />
        <Botao
          id="SGP_BUTTON_CANCELAR"
          label="Cancelar"
          disabled={!emEdicao}
          onClick={() => void cancelar()}
        />
        {!novo && (
          <BotaoExcluir
            disabled={somenteConsulta || !permissoes?.podeExcluir}
            onClick={() => void excluir()}
          />
        )}
        <Botao
          id="SGP_BUTTON_ALTERAR_CADASTRAR"
          label={novo ? "Cadastrar" : "Alterar"}
          disabled={desabilitarCampos || (!novo && !emEdicao)}
          onClick={() => void validarESalvar()}
        />
      </Cabecalho>
      <section className="calendario-card">
        {valores && (
          <Formik
            innerRef={formRef}
            enableReinitialize
            initialValues={valores}
            validationSchema={esquema}
            onSubmit={(dados) => void salvar(dados)}
          >
            {(form) => (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12} xl={8}>
                  <Loader loading={carregandoCalendarios}>
                    <SelectAutocomplete
                      id="select-tipo-calendario"
                      label="Calendário"
                      labelRequired
                      placeholder="Selecione o calendário"
                      lista={calendarios}
                      value={calendario?.descricao || ""}
                      disabled={desabilitarCampos || !novo}
                      temErro={emEdicao && !calendario?.id}
                      mensagemErro={textoObrigatorio}
                      onSelect={(texto) => {
                        const encontrado = calendarios.find((item) => item.descricao === texto) || null;
                        setCalendario(encontrado);
                        setUes([]);
                        form.setFieldValue("ueCodigo", "");
                        setDreCodigo(form.values.dreCodigo);
                        marcarEdicao();
                      }}
                      handleSearch={(texto) => {
                        if (texto.length > 2 || texto.length === 0) void buscarCalendarios(texto);
                        marcarEdicao();
                      }}
                    />
                  </Loader>
                </Col>
                <Col xs={24} xl={12}>
                  <Loader loading={carregandoDres}>
                    <SelectCampo
                      id="codigo-dre"
                      label="Diretoria Regional de Educação (DRE)"
                      labelRequired
                      lista={dres}
                      valueOption="codigo"
                      valueText="nome"
                      disabled={dres.length === 1 || desabilitarCampos}
                      value={form.values.dreCodigo}
                      placeholder="Selecione uma DRE"
                      showSearch
                      erro={
                        form.touched.dreCodigo ? (form.errors.dreCodigo as string) : undefined
                      }
                      onChange={(valor) => {
                        const codigo = String(valor);
                        form.setFieldValue("dreCodigo", codigo);
                        form.setFieldValue("ueCodigo", "");
                        setDreCodigo(codigo);
                        marcarEdicao();
                      }}
                    />
                  </Loader>
                </Col>
                <Col xs={24} xl={12}>
                  <Loader loading={carregandoUes}>
                    <SelectCampo
                      id="codigo-ue"
                      label="Unidade Escolar (UE)"
                      labelRequired
                      lista={ues}
                      valueOption="codigo"
                      valueText="nome"
                      disabled={!dreCodigo || ues.length === 1 || desabilitarCampos}
                      value={form.values.ueCodigo}
                      placeholder="Selecione uma UE"
                      showSearch
                      erro={form.touched.ueCodigo ? (form.errors.ueCodigo as string) : undefined}
                      onChange={(valor) => {
                        form.setFieldValue("ueCodigo", String(valor));
                        marcarEdicao();
                      }}
                    />
                  </Loader>
                </Col>
                <Col span={24}>
                  <CampoTexto
                    form={form as unknown as FormikProps<Record<string, unknown>>}
                    name="descricao"
                    id="descricao"
                    label="Descrição"
                    labelRequired
                    desabilitado={desabilitarCampos}
                    onChange={marcarEdicao}
                  />
                </Col>
                <Col xs={24} md={12} lg={6}>
                  <CampoData
                    form={form as unknown as FormikProps<Record<string, unknown>>}
                    name="dataInicio"
                    label="Início"
                    labelRequired
                    placeholder="DD/MM/AAAA"
                    desabilitado={desabilitarCampos}
                    onChange={marcarEdicao}
                  />
                </Col>
                <Col xs={24} md={12} lg={6}>
                  <CampoData
                    form={form as unknown as FormikProps<Record<string, unknown>>}
                    name="dataFim"
                    label="Fim"
                    labelRequired
                    placeholder="DD/MM/AAAA"
                    desabilitado={desabilitarCampos}
                    onChange={marcarEdicao}
                  />
                </Col>
                <Col xs={24} md={12} lg={12}>
                  <SelectCampo
                    id="bimestres"
                    label="Bimestre"
                    labelRequired
                    multiple
                    lista={listaBimestres}
                    valueOption="valor"
                    valueText="descricao"
                    value={form.values.bimestres}
                    disabled={desabilitarCampos}
                    placeholder="Selecione bimestre(s)"
                    erro={
                      form.touched.bimestres ? (form.errors.bimestres as string) : undefined
                    }
                    onChange={(selecionados) => {
                      onchangeMultiSelect(
                        (selecionados as string[]) || [],
                        form.values.bimestres,
                        (novos) => {
                          form.setFieldValue("bimestres", novos);
                          form.setFieldTouched("bimestres", true, false);
                        },
                      );
                      marcarEdicao();
                    }}
                  />
                </Col>
                {auditoria.criadoEm && (
                  <Col span={24}>
                    <Auditoria
                      criadoEm={auditoria.criadoEm}
                      criadoPor={auditoria.criadoPor}
                      criadoRf={auditoria.criadoRf}
                      alteradoPor={auditoria.alteradoPor}
                      alteradoEm={auditoria.alteradoEm}
                      alteradoRf={auditoria.alteradoRf}
                    />
                  </Col>
                )}
                {aprovacao && (
                  <Col span={24}>
                    <div className="aprovacao">{aprovacao}</div>
                  </Col>
                )}
              </Row>
            )}
          </Formik>
        )}
      </section>
    </Loader>
  );
};

export default ReaberturaCadastro;
