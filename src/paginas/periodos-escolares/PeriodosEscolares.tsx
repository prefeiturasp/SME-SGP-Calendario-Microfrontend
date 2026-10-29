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
  comoLista,
  ehCalendarioAnual,
  type TipoCalendario,
} from "../../core/constantes";
import { paraDia } from "../../core/datas";
import {
  aplicarDatasNoPeriodo,
  montarCadastroPeriodo,
  valoresPorBimestre,
  type PeriodoEscolarApi,
  type ValoresPeriodo,
} from "../../core/regras/periodoEscolar";
import { verificaSomenteConsulta } from "../../core/sessao";
import { esquemaPeriodosEscolares } from "../../core/validacao/esquemaDatas";
import { calendarioService } from "../../services/calendarioService";
import { periodoEscolarService } from "../../services/periodoEscolarService";
import type { RootState } from "../../types/redux";

type Formulario = FormikProps<Record<string, unknown>>;

const rotulos = ["1 ° Bimestre", "2 ° Bimestre", "3 ° Bimestre", "4 ° Bimestre"];
const campos = [
  ["primeiroBimestreDataInicial", "primeiroBimestreDataFinal"],
  ["segundoBimestreDataInicial", "segundoBimestreDataFinal"],
  ["terceiroBimestreDataInicial", "terceiroBimestreDataFinal"],
  ["quartoBimestreDataInicial", "quartoBimestreDataFinal"],
] as const;

const normalizarDatas = (valores: ValoresPeriodo) => {
  const resultado: Record<string, unknown> = {};
  Object.entries(valores).forEach(([chave, valor]) => {
    resultado[chave] = paraDia(valor) || "";
  });
  return resultado;
};

const PeriodosEscolares = () => {
  const navigate = useDestino();
  const usuario = useSelector((state: RootState) => state.usuario);
  const permissoes = usuario.permissoes?.[ROTAS.PERIODOS_ESCOLARES];
  const [lista, setLista] = useState<TipoCalendario[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregandoTipos, setCarregandoTipos] = useState(false);
  const [calendarioId, setCalendarioId] = useState<number | string>("");
  const [descricao, setDescricao] = useState("");
  const [anual, setAnual] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [desabilitaCampos, setDesabilitaCampos] = useState(false);
  const [periodo, setPeriodo] = useState<PeriodoEscolarApi | null>(null);
  const [valoresIniciais, setValoresIniciais] = useState<Record<string, unknown>>({});
  const [auditoria, setAuditoria] = useState<PeriodoEscolarApi>({});
  const validacoes = useMemo(() => esquemaPeriodosEscolares(anual), [anual]);
  const [somenteConsulta, setSomenteConsulta] = useState(false);

  useEffect(() => {
    setSomenteConsulta(verificaSomenteConsulta(permissoes));
  }, [permissoes]);

  const consultar = async (id: number | string) => {
    try {
      const resposta = await periodoEscolarService.obterPorTipoCalendario(id);
      const dados = resposta.data;
      const possuiPeriodos = !!dados?.periodos?.length;
      setDesabilitaCampos(
        possuiPeriodos
          ? !permissoes?.podeAlterar || somenteConsulta
          : !permissoes?.podeIncluir || somenteConsulta,
      );
      setAuditoria(dados || {});
      setPeriodo(possuiPeriodos ? dados : null);
      setValoresIniciais(normalizarDatas(valoresPorBimestre(dados)));
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
    }
  };

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

  const selecionar = (texto: string, form: Formulario | null, escolheu: boolean) => {
    const tipo = lista.find((item) => item.descricao === texto);
    setAnual(ehCalendarioAnual(tipo));
    setDescricao(texto);
    setCalendarioId(tipo?.id || "");
    if (escolheu && tipo?.id && form) {
      form.resetForm();
      setModoEdicao(false);
      setValoresIniciais({});
      void consultar(tipo.id);
    }
  };

  const salvar = async (form: Formulario, voltar: boolean) => {
    const valores = form.values as ValoresPeriodo;
    try {
      if (periodo?.periodos?.length) {
        await periodoEscolarService.salvar(aplicarDatasNoPeriodo(periodo, valores));
        sucesso("Suas informações foram editadas com sucesso.");
        await consultar(periodo.tipoCalendario || calendarioId);
      } else {
        const calendario = lista.find((item) => String(item.id) === String(calendarioId));
        if (!calendario) return;
        await periodoEscolarService.salvar(montarCadastroPeriodo(calendario, valores, anual));
        sucesso("Suas informações foram salvas com sucesso.");
        await consultar(calendario.id);
      }
      setModoEdicao(false);
      if (voltar) navigate("/");
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
    }
  };

  const validarESalvar = async (form: Formulario, voltar = false) => {
    setModoEdicao(true);
    campos.flat().forEach((campo) => form.setFieldTouched(campo, true, false));
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
        <>
          <Cabecalho pagina="Cadastro do período escolar">
            <BotaoVoltar onClick={() => void voltar(form)} />
            <Botao
              id="SGP_BUTTON_CANCELAR"
              label="Cancelar"
              disabled={!modoEdicao || desabilitaCampos}
              onClick={() => void cancelar(form)}
            />
            <Botao
              id="SGP_BUTTON_ALTERAR_CADASTRAR"
              label={auditoria.criadoEm ? "Alterar" : "Cadastrar"}
              disabled={
                !calendarioId || desabilitaCampos || (!!auditoria.criadoEm && !modoEdicao)
              }
              onClick={() => void validarESalvar(form)}
            />
          </Cabecalho>
          <section className="calendario-card">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={10} lg={8}>
                <Loader loading={carregandoTipos}>
                  <SelectAutocomplete
                    id="calEscolar"
                    label="Calendário"
                    labelRequired
                    placeholder="Selecione um tipo de calendário"
                    lista={lista}
                    value={descricao}
                    carregando={carregandoTipos}
                    temErro={modoEdicao && !calendarioId}
                    mensagemErro="Campo obrigatório"
                    onSelect={(texto) => selecionar(texto, form, true)}
                    onChange={(texto) => selecionar(texto, form, false)}
                    handleSearch={(texto) => {
                      if (texto.length > 3 || texto.length === 0) setPesquisa(texto);
                    }}
                  />
                </Loader>
              </Col>
            </Row>
            {!!calendarioId &&
              campos.slice(0, anual ? 4 : 2).map((par, indice) => (
                <Row gutter={[16, 16]} key={par[0]} style={{ marginTop: 12 }}>
                  <Col xs={24} lg={4}>
                    <div className="caixa-bimestre">{rotulos[indice]}</div>
                  </Col>
                  <Col xs={24} lg={6}>
                    <CampoData
                      form={form}
                      name={par[0]}
                      label={indice === 0 ? "Início do Bimestre" : undefined}
                      placeholder="Início do Bimestre"
                      desabilitado={desabilitaCampos}
                      onChange={() => setModoEdicao(true)}
                    />
                  </Col>
                  <Col xs={24} lg={6}>
                    <CampoData
                      form={form}
                      name={par[1]}
                      label={indice === 0 ? "Fim do Bimestre" : undefined}
                      placeholder="Início do Bimestre"
                      desabilitado={desabilitaCampos}
                      onChange={() => setModoEdicao(true)}
                    />
                  </Col>
                </Row>
              ))}
            {descricao && auditoria.criadoEm && (
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
  );
};

export default PeriodosEscolares;
