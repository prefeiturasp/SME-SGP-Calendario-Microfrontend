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
import { confirmar, sucesso } from "../../core/config/alertas";
import { ROTAS, ehCalendarioAnual, type TipoCalendario } from "../../core/constantes";
import { diasEntre, paraDia, type ValorData } from "../../core/datas";
import {
  aplicarDatasNoFechamento,
  type FechamentoAbertura,
  type FechamentoBimestre,
} from "../../core/regras/fechamentoAbertura";
import { verificaSomenteConsulta } from "../../core/sessao";
import { esquemaFechamentoAbertura } from "../../core/validacao/esquemaDatas";
import type { RootState } from "../../types/redux";

// import { calendarioService } from "../../services/calendarioService";
// import { periodoFechamentoService } from "../../services/periodoFechamentoService";

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

const tiposCalendarioMockados: TipoCalendario[] = [
  {
    id: 1,
    descricao: "Calendário Fundamental/Médio 2026",
    periodo: 1,
    modalidade: 1,
    anoLetivo: 2026,
  },
  {
    id: 2,
    descricao: "Calendário EJA 2026 - 1º semestre",
    periodo: 2,
    modalidade: 2,
    anoLetivo: 2026,
  },
  {
    id: 3,
    descricao: "Calendário Infantil 2026",
    periodo: 1,
    modalidade: 3,
    anoLetivo: 2026,
  },
];

const fechamentoMockado = (
  tipoCalendarioId: number,
  bimestres: number[],
  migrado = false,
): FechamentoAbertura => ({
  id: tipoCalendarioId + 100,
  tipoCalendarioId,
  periodoEscolarId: tipoCalendarioId + 200,
  migrado,
  criadoPor: "Usuário de demonstração",
  criadoRF: "1234567",
  criadoEm: "2026-01-05T10:00:00",
  fechamentosBimestres: bimestres.map((bimestre) => {
    const inicioMinimo = `2026-${String(1 + (bimestre - 1) * 3).padStart(2, "0")}-01`;
    const finalMaximo = `2026-${String(Math.min(bimestre * 3, 12)).padStart(2, "0")}-${bimestre === 4 ? "31" : "30"}`;
    return {
      bimestre,
      inicioDoFechamento: `2026-${String(1 + (bimestre - 1) * 3).padStart(2, "0")}-10`,
      finalDoFechamento: `2026-${String(1 + (bimestre - 1) * 3).padStart(2, "0")}-20`,
      inicioMinimo,
      finalMaximo,
    };
  }),
});

const fechamentosMockadosIniciais: Record<number, FechamentoAbertura> = {
  1: fechamentoMockado(1, [1, 2, 3, 4], true),
  2: fechamentoMockado(2, [1, 2]),
  3: fechamentoMockado(3, [1, 2, 3, 4]),
};

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
  const [fechamentosMockados, setFechamentosMockados] = useState<
    Record<number, FechamentoAbertura>
  >(() => fechamentosMockadosIniciais);

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
    setCarregandoTipos(true);
    // Dados de calendário mockados enquanto a integração com a API está desativada.
    // const resposta = await calendarioService.obterTiposCalendarioAutoComplete(pesquisa);
    const termo = pesquisa.trim().toLocaleLowerCase();
    setLista(
      tiposCalendarioMockados.filter((tipo) =>
        tipo.descricao.toLocaleLowerCase().includes(termo),
      ),
    );
    setCarregandoTipos(false);
  }, [pesquisa]);

  const carregar = useCallback(() => {
    setModoEdicao(false);
    if (!tipoId) {
      limpar();
      return;
    }
    setProcessando(true);
    // Dados de abertura mockados enquanto a integração com a API está desativada.
    // const resposta = await periodoFechamentoService.obterPorTipoCalendario(tipoId);
    const dados = fechamentosMockados[Number(tipoId)];
    if (dados?.fechamentosBimestres) {
      const formulario = montarFormulario(dados);
      setFechamento(formulario);
      setRegistroMigrado(!!dados.migrado);
      setAuditoria(dados);
    } else {
      limpar();
    }
    setProcessando(false);
  }, [fechamentosMockados, limpar, tipoId]);

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
    // A chamada de gravação permanece aqui para reativar a integração com a API.
    // await periodoFechamentoService.salvar(payload);
    const idMockado =
      payload.id && payload.id > 0
        ? payload.id
        : Math.max(100, ...Object.values(fechamentosMockados).map((item) => item.id || 0)) +
          1;
    const dadosAtualizados: FechamentoAbertura = {
      ...payload,
      id: idMockado,
      tipoCalendarioId: Number(tipoId),
      alteradoPor: "Usuário de demonstração",
      alteradoRF: "1234567",
      alteradoEm: new Date().toISOString(),
    };
    setFechamentosMockados((atuais) => ({
      ...atuais,
      [Number(tipoId)]: dadosAtualizados,
    }));
    setFechamento(montarFormulario(dadosAtualizados));
    setAuditoria(dadosAtualizados);
    setRegistroMigrado(!!dadosAtualizados.migrado);
    setModoEdicao(false);
    sucesso("Períodos salvos com sucesso.");
    setProcessando(false);
    if (voltar) navigate("/");
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
            <Cabecalho pagina="Período de Fechamento (Abertura) (Micro frontend)">
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
                <div style={{ width: "100%", maxWidth: 420 }}>
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
                        if (lista.some((tipo) => tipo.descricao === texto)) {
                          setPesquisa("");
                          return;
                        }
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
