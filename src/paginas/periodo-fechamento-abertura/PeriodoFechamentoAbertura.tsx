import { useCallback, useEffect, useMemo, useState } from "react";
import { Col, Row } from "antd";
import { Formik, type FormikProps } from "formik";
import { useSelector } from "react-redux";
import { useDestino } from "../../core/endereco";
import { Auditoria } from "../../componentes/ui/Auditoria";
import { Botao, BotaoVoltar } from "../../componentes/ui/Botao";
import { Cabecalho } from "../../componentes/ui/Cabecalho";
import { CampoData } from "../../componentes/ui/CampoData";
import { Loader } from "../../componentes/ui/Loader";
import { SelectAutocomplete } from "../../componentes/ui/SelectAutocomplete";
import { confirmar, exibirErrosApi, sucesso } from "../../core/config/alertas";
import { ROTAS, comoLista, ehCalendarioAnual, type TipoCalendario } from "../../core/constantes";
import { diasEntre, paraDia, type ValorData } from "../../core/datas";
import {
  aplicarDatasNoFechamento,
  type FechamentoAbertura,
  type FechamentoBimestre,
} from "../../core/regras/fechamentoAbertura";
import { verificaSomenteConsulta } from "../../core/sessao";
import { esquemaFechamentoAbertura } from "../../core/validacao/esquemaDatas";
import { calendarioService } from "../../services/calendarioService";
import { periodoFechamentoService } from "../../services/periodoFechamentoService";
import type { RootState } from "../../types/redux";

type Formulario = FormikProps<Record<string, unknown>>;

const vazio = (): FechamentoAbertura => ({
  tipoCalendarioId: null,
  periodoEscolarId: null,
  migrado: false,
  id: 0,
  fechamentosBimestres: [],
});

const chaveInicio = (bimestre: number) => `bimestre${bimestre}InicioDoFechamento`;
const chaveFim = (bimestre: number) => `bimestre${bimestre}FinalDoFechamento`;

const montarFormulario = (dados: FechamentoAbertura) => {
  const formulario: FechamentoAbertura = {
    ...dados,
    fechamentosBimestres: dados.fechamentosBimestres.map((item) => ({ ...item })),
  };
  formulario.fechamentosBimestres.forEach((item) => {
    formulario[chaveInicio(item.bimestre)] = paraDia(item.inicioDoFechamento) || "";
    formulario[chaveFim(item.bimestre)] = paraDia(item.finalDoFechamento) || "";
    item.inicioMinimo = paraDia(item.inicioMinimo);
    item.finalMaximo = paraDia(item.finalMaximo);
  });
  return formulario;
};

const PeriodoFechamentoAbertura = () => {
  const navigate = useDestino();
  const usuario = useSelector((state: RootState) => state.usuario);
  const permissoes = usuario.permissoes?.[ROTAS.PERIODO_FECHAMENTO_ABERTURA];
  const [somenteConsulta, setSomenteConsulta] = useState(false);
  const [lista, setLista] = useState<TipoCalendario[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregandoTipos, setCarregandoTipos] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [tipoId, setTipoId] = useState<number | string>("");
  const [anual, setAnual] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [fechamento, setFechamento] = useState<FechamentoAbertura>(vazio());
  const [registroMigrado, setRegistroMigrado] = useState(false);
  const [auditoria, setAuditoria] = useState<FechamentoAbertura>(vazio());

  const idRegistro = Number(fechamento.id || 0);
  const existente = idRegistro > 0;
  const desabilitarCampos = existente
    ? somenteConsulta || !permissoes?.podeAlterar
    : somenteConsulta || !permissoes?.podeIncluir;
  const validacoes = useMemo(() => esquemaFechamentoAbertura(anual), [anual]);

  useEffect(() => {
    setSomenteConsulta(verificaSomenteConsulta(permissoes));
  }, [permissoes]);

  const limpar = useCallback(() => {
    setFechamento(vazio());
    setRegistroMigrado(false);
    setAuditoria(vazio());
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregandoTipos(true);
    calendarioService
      .obterTiposCalendarioAutoComplete(pesquisa)
      .then((resposta) => {
        if (ativo) setLista(comoLista<TipoCalendario>(resposta.data));
      })
      .catch((falha) => exibirErrosApi(falha, usuario.logado))
      .finally(() => {
        if (ativo) setCarregandoTipos(false);
      });
    return () => {
      ativo = false;
    };
  }, [pesquisa, usuario.logado]);

  const carregar = useCallback(() => {
    setModoEdicao(false);
    if (!tipoId) {
      limpar();
      return;
    }
    setProcessando(true);
    periodoFechamentoService
      .obterPorTipoCalendario(tipoId)
      .then((resposta) => {
        if (resposta.data?.fechamentosBimestres) {
          const dados = montarFormulario(resposta.data);
          setFechamento(dados);
          setRegistroMigrado(!!resposta.data.migrado);
          setAuditoria(resposta.data);
        } else {
          limpar();
        }
      })
      .catch((falha) => {
        limpar();
        exibirErrosApi(falha, usuario.logado);
      })
      .finally(() => setProcessando(false));
  }, [limpar, tipoId, usuario.logado]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const selecionar = (texto: string) => {
    const tipo = lista.find((item) => item.descricao === texto);
    setAnual(ehCalendarioAnual(tipo));
    setDescricao(texto);
    setTipoId(tipo?.id || "");
  };

  const salvar = async (form: Formulario, voltar: boolean) => {
    const payload = aplicarDatasNoFechamento({
      ...(form.values as FechamentoAbertura),
      fechamentosBimestres: (
        (form.values.fechamentosBimestres as FechamentoBimestre[]) || []
      ).map((item) => ({ ...item })),
    });
    setProcessando(true);
    try {
      await periodoFechamentoService.salvar(payload);
      sucesso("Períodos salvos com sucesso.");
      setModoEdicao(false);
      carregar();
      if (voltar) navigate("/");
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
    } finally {
      setProcessando(false);
    }
  };

  const validarESalvar = async (form: Formulario, voltar = false) => {
    setModoEdicao(true);
    Object.keys(form.values).forEach((campo) => form.setFieldTouched(campo, true, false));
    const erros = await form.validateForm();
    if (Object.keys(erros).length === 0) await salvar(form, voltar);
  };

  const voltar = async (form: Formulario) => {
    if (!modoEdicao) {
      navigate("/");
      return;
    }
    const confirmou = await confirmar(
      "Atenção",
      "",
      "Suas alterações não foram salvas, deseja salvar agora?",
      "Sim",
      "Não",
    );
    if (confirmou) await validarESalvar(form, true);
    else navigate("/");
  };

  const cancelar = async (form: Formulario) => {
    if (!modoEdicao) return;
    const confirmou = await confirmar(
      "Atenção",
      "Você não salvou as informações preenchidas.",
      "Deseja realmente cancelar as alterações?",
    );
    if (confirmou) {
      form.resetForm();
      setModoEdicao(false);
      carregar();
    }
  };

  return (
    <Loader loading={processando}>
      <Formik
        enableReinitialize
        initialValues={fechamento as unknown as Record<string, unknown>}
        validationSchema={validacoes}
        onSubmit={() => undefined}
      >
        {(form) => (
          <>
            <Cabecalho pagina="Período de Fechamento (Abertura)">
              <BotaoVoltar onClick={() => void voltar(form)} />
              <Botao
                id="SGP_BUTTON_CANCELAR"
                label="Cancelar"
                disabled={desabilitarCampos || !modoEdicao}
                onClick={() => void cancelar(form)}
              />
              <Botao
                id="SGP_BUTTON_ALTERAR_CADASTRAR"
                label={existente ? "Alterar" : "Cadastrar"}
                disabled={desabilitarCampos || (existente && !modoEdicao) || !descricao}
                onClick={() => void validarESalvar(form)}
              />
            </Cabecalho>
            <section className="calendario-card">
              <div className="linha-filtros-reversa">
                <div style={{ minWidth: 280, flex: 1 }}>
                  <Loader loading={carregandoTipos}>
                    <SelectAutocomplete
                      id="tipoCalendarioId"
                      label="Calendário"
                      labelRequired
                      placeholder="Selecione um tipo de calendário"
                      lista={lista}
                      value={descricao}
                      temErro={modoEdicao && !descricao}
                      mensagemErro="Campo obrigatório"
                      onSelect={selecionar}
                      onChange={selecionar}
                      handleSearch={(texto) => {
                        if (texto.length > 3 || texto.length === 0) setPesquisa(texto);
                      }}
                    />
                  </Loader>
                </div>
                {registroMigrado && <div className="registro-migrado">Registro Migrado</div>}
              </div>
              {fechamento.fechamentosBimestres.map((item, indice) => (
                <Row gutter={[16, 16]} key={`${item.bimestre}-${indice}`} style={{ marginTop: 12 }}>
                  <Col xs={24} md={12}>
                    <div className="caixa-bimestre">{item.bimestre}° Bimestre</div>
                  </Col>
                  <Col xs={24} md={6}>
                    <CampoData
                      form={form}
                      name={chaveInicio(item.bimestre)}
                      placeholder="Início do Bimestre"
                      desabilitado={desabilitarCampos}
                      diasParaHabilitar={diasEntre(
                        item.inicioMinimo as ValorData,
                        item.finalMaximo as ValorData,
                      )}
                      onChange={() => setModoEdicao(true)}
                    />
                  </Col>
                  <Col xs={24} md={6}>
                    <CampoData
                      form={form}
                      name={chaveFim(item.bimestre)}
                      placeholder="Fim do Bimestre"
                      desabilitado={desabilitarCampos}
                      diasParaHabilitar={diasEntre(
                        item.inicioMinimo as ValorData,
                        item.finalMaximo as ValorData,
                      )}
                      onChange={() => setModoEdicao(true)}
                    />
                  </Col>
                </Row>
              ))}
              {tipoId && existente && auditoria.criadoEm && (
                <Auditoria
                  criadoEm={auditoria.criadoEm}
                  criadoPor={auditoria.criadoPor}
                  criadoRf={auditoria.criadoRF}
                  alteradoPor={auditoria.alteradoPor}
                  alteradoEm={auditoria.alteradoEm}
                  alteradoRf={auditoria.alteradoRF}
                />
              )}
            </section>
          </>
        )}
      </Formik>
    </Loader>
  );
};

export default PeriodoFechamentoAbertura;
