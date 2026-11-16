import { useEffect, useMemo, useState } from "react";
import { Formik, type FormikProps } from "formik";
import { Col, Row } from "antd";
import { useSelector } from "react-redux";
import { useDestino } from "../../core/endereco";
import { Auditoria } from "../../componentes/ui/Auditoria";
import { Botao, BotaoVoltar } from "../../componentes/ui/Botao";
import { Cabecalho } from "../../componentes/ui/Cabecalho";
import { CampoData } from "../../componentes/ui/CampoData";
import { Loader } from "../../componentes/ui/Loader";
import { SelectAutocomplete } from "../../componentes/ui/SelectAutocomplete";
import { confirmar, exibirErrosApi, sucesso } from "../../core/config/alertas";
import {
  ROTAS,
  ehCalendarioAnual,
  type TipoCalendario,
} from "../../core/constantes";
import { paraDia } from "../../core/datas";
import {
  montarCadastroPeriodo,
  valoresPorBimestre,
  type PeriodoEscolarApi,
  type ValoresPeriodo,
} from "../../core/regras/periodoEscolar";
import { verificaSomenteConsulta } from "../../core/sessao";
import { esquemaPeriodosEscolares } from "../../core/validacao/esquemaDatas";
import { periodoEscolarService } from "../../services/periodoEscolarService";
import type { RootState } from "../../types/redux";
import "./periodos-escolares.css";

type Formulario = FormikProps<Record<string, unknown>>;

const rotulos = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];
const campos = [
  ["primeiroBimestreDataInicial", "primeiroBimestreDataFinal"],
  ["segundoBimestreDataInicial", "segundoBimestreDataFinal"],
  ["terceiroBimestreDataInicial", "terceiroBimestreDataFinal"],
  ["quartoBimestreDataInicial", "quartoBimestreDataFinal"],
] as const;

const normalizarDatas = (valores: ValoresPeriodo): Record<string, unknown> =>
  Object.fromEntries(
    campos
      .flat()
      .map((campo) => [
        campo,
        paraDia(valores[campo])?.format("YYYY-MM-DD") || "",
      ])
  );

const PeriodosEscolares = () => {
  const navigate = useDestino();
  const usuario = useSelector((state: RootState) => state.usuario);
  const permissoes = usuario.permissoes?.[ROTAS.PERIODOS_ESCOLARES];
  const podeConsultar = !!permissoes?.podeConsultar;
  const [lista, setLista] = useState<TipoCalendario[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregandoTipos, setCarregandoTipos] = useState(false);
  const [calendario, setCalendario] = useState<TipoCalendario | null>(null);
  const [descricao, setDescricao] = useState("");
  const [carregandoPeriodo, setCarregandoPeriodo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [periodo, setPeriodo] = useState<PeriodoEscolarApi | null>(null);
  const [valoresIniciais, setValoresIniciais] = useState(() =>
    normalizarDatas({})
  );
  const anual = ehCalendarioAnual(calendario);
  const editando = !!periodo?.periodos?.length;
  const podeEditar =
    podeConsultar &&
    !!(editando ? permissoes?.podeAlterar : permissoes?.podeIncluir);
  const ocupado = salvando || carregandoPeriodo;
  // A sobreposição é validada pela fonte de dados, como será feito pelo BFF.
  const validacoes = useMemo(
    () => esquemaPeriodosEscolares(anual, { validarSequencia: false }),
    [anual]
  );

  useEffect(() => {
    verificaSomenteConsulta(permissoes);
  }, [permissoes]);

  useEffect(() => {
    let ativo = true;
    if (!podeConsultar) {
      setLista([]);
      setCarregandoTipos(false);
      return;
    }
    setCarregandoTipos(true);
    periodoEscolarService
      .listarCalendarios(pesquisa)
      .then((dados) => {
        if (ativo) setLista(dados);
      })
      .catch((falha) => {
        if (ativo) exibirErrosApi(falha, usuario.logado);
      })
      .finally(() => {
        if (ativo) setCarregandoTipos(false);
      });
    return () => {
      ativo = false;
    };
  }, [pesquisa, podeConsultar, usuario.logado]);

  useEffect(() => {
    let ativo = true;
    setPeriodo(null);
    setValoresIniciais(normalizarDatas({}));
    setTentouSalvar(false);
    if (!calendario || !podeConsultar) {
      setCarregandoPeriodo(false);
      return;
    }
    setCarregandoPeriodo(true);
    periodoEscolarService
      .obterPorTipoCalendario(calendario.id)
      .then((dados) => {
        if (!ativo) return;
        setPeriodo(dados);
        setValoresIniciais(normalizarDatas(valoresPorBimestre(dados)));
      })
      .catch((falha) => {
        if (ativo) exibirErrosApi(falha, usuario.logado);
      })
      .finally(() => {
        if (ativo) setCarregandoPeriodo(false);
      });
    return () => {
      ativo = false;
    };
  }, [calendario, podeConsultar, usuario.logado]);

  const selecionar = (texto: string, escolheu: boolean) => {
    setDescricao(texto);
    setTentouSalvar(false);
    if (escolheu) {
      setCalendario(lista.find((item) => item.descricao === texto) || null);
    } else if (texto !== calendario?.descricao) {
      setCalendario(null);
    }
  };

  const validarESalvar = async (form: Formulario, voltar = false) => {
    if (!calendario || !podeEditar || ocupado) return;
    setTentouSalvar(true);
    const camposAtivos = campos.slice(0, anual ? 4 : 2).flat();
    await form.setTouched(
      Object.fromEntries(camposAtivos.map((campo) => [campo, true])),
      false
    );
    const erros = await form.validateForm();
    if (Object.keys(erros).length) return;
    setSalvando(true);
    try {
      const cadastro = montarCadastroPeriodo(
        calendario,
        form.values as ValoresPeriodo,
        anual
      );
      // Mantém os IDs da edição sem modificar o resultado da consulta anterior.
      cadastro.periodos.forEach((item) => {
        item.id =
          periodo?.periodos?.find(
            (anterior) => anterior.bimestre === item.bimestre
          )?.id || 0;
      });
      const resultado = await periodoEscolarService.salvar(cadastro);
      const valores = normalizarDatas(valoresPorBimestre(resultado));
      setPeriodo(resultado);
      setValoresIniciais(valores);
      form.resetForm({ values: valores });
      setTentouSalvar(false);
      sucesso(
        editando
          ? "Suas informações foram editadas com sucesso."
          : "Suas informações foram salvas com sucesso."
      );
      if (voltar) navigate("/");
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
    } finally {
      setSalvando(false);
    }
  };

  const voltar = async (form: Formulario) => {
    if (ocupado) return;
    if (!form.dirty) {
      navigate("/");
      return;
    }
    const confirmou = await confirmar(
      "Atenção",
      "",
      "Suas alterações não foram salvas, deseja salvar agora?"
    );
    if (confirmou) await validarESalvar(form, true);
    else navigate("/");
  };

  const cancelar = async (form: Formulario) => {
    if (!form.dirty || ocupado) return;
    const confirmou = await confirmar(
      "Atenção",
      "Você não salvou as informações preenchidas.",
      "Deseja realmente cancelar as alterações?"
    );
    if (confirmou) {
      form.resetForm();
      setTentouSalvar(false);
    }
  };

  return (
    <Formik
      enableReinitialize
      initialValues={valoresIniciais}
      validationSchema={validacoes}
      onSubmit={() => undefined}
    >
      {(form) => (
        <div className="periodos-escolares">
          <Cabecalho pagina="Cadastro do período escolar">
            <BotaoVoltar onClick={() => void voltar(form)} />
            <Botao
              id="SGP_BUTTON_CANCELAR"
              label="Cancelar"
              disabled={!form.dirty || !podeEditar || ocupado}
              onClick={() => void cancelar(form)}
            />
            <Botao
              id="SGP_BUTTON_ALTERAR_CADASTRAR"
              label={editando ? "Alterar" : "Cadastrar"}
              disabled={
                !calendario ||
                !podeEditar ||
                ocupado ||
                (editando && !form.dirty)
              }
              onClick={() => void validarESalvar(form)}
            />
          </Cabecalho>
          <section
            className="calendario-card"
            aria-label="Períodos escolares"
            aria-busy={ocupado}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={10} lg={8}>
                <SelectAutocomplete
                  id="calEscolar"
                  label="Calendário"
                  labelRequired
                  placeholder="Selecione um tipo de calendário"
                  lista={lista}
                  value={descricao}
                  carregando={carregandoTipos}
                  disabled={!podeConsultar || salvando}
                  temErro={tentouSalvar && !calendario}
                  mensagemErro="Campo obrigatório"
                  onSelect={(texto) => selecionar(texto, true)}
                  onChange={(texto) => selecionar(texto, false)}
                  handleSearch={setPesquisa}
                />
              </Col>
            </Row>
            {!podeConsultar && (
              <p role="status">
                Você não tem permissão para consultar períodos escolares.
              </p>
            )}
            <Loader loading={carregandoPeriodo}>
              {!!calendario && podeConsultar && (
                <div className="periodos-escolares-bimestres">
                  <Row
                    gutter={[30, 8]}
                    className="periodos-escolares-colunas"
                    aria-hidden="true"
                  >
                    <Col lg={4}>Bimestre</Col>
                    <Col lg={6}>Início do Bimestre</Col>
                    <Col lg={6}>Fim do Bimestre</Col>
                  </Row>
                  {campos.slice(0, anual ? 4 : 2).map((par, indice) => (
                    <Row
                      gutter={[30, 8]}
                      key={par[0]}
                      role="group"
                      aria-label={rotulos[indice]}
                      className="periodos-escolares-linha"
                    >
                      <Col xs={24} lg={4}>
                        <div className="caixa-bimestre">{rotulos[indice]}</div>
                      </Col>
                      {par.map((campo, posicao) => (
                        <Col xs={24} lg={6} key={campo}>
                          <label
                            className="periodos-escolares-label-data"
                            htmlFor={campo}
                          >
                            {posicao === 0 ? "Início" : "Fim"} do{" "}
                            {rotulos[indice]}
                          </label>
                          <CampoData
                            form={form}
                            name={campo}
                            placeholder={
                              posicao === 0
                                ? "Início do Bimestre"
                                : "Fim do Bimestre"
                            }
                            desabilitado={!podeEditar || ocupado}
                          />
                        </Col>
                      ))}
                    </Row>
                  ))}
                </div>
              )}
            </Loader>
            {podeConsultar && calendario && periodo?.criadoEm && (
              <Auditoria
                key={calendario.id}
                criadoEm={periodo.criadoEm}
                criadoPor={periodo.criadoPor}
                criadoRf={periodo.criadoRF}
                alteradoPor={periodo.alteradoPor}
                alteradoEm={periodo.alteradoEm}
                alteradoRf={periodo.alteradoRF}
              />
            )}
          </section>
        </div>
      )}
    </Formik>
  );
};

export default PeriodosEscolares;
