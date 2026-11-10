import { useEffect, useMemo, useState } from "react";
import { Formik, useFormikContext, type FormikProps } from "formik";
import { Col, Input, Radio, Row } from "antd";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Auditoria } from "../../componentes/ui/Auditoria";
import { Botao, BotaoExcluir, BotaoVoltar } from "../../componentes/ui/Botao";
import { Cabecalho } from "../../componentes/ui/Cabecalho";
import { Loader } from "../../componentes/ui/Loader";
import { SelectCampo } from "../../componentes/ui/SelectCampo";
import { confirmar, erro, exibirErrosApi, sucesso } from "../../core/config/alertas";
import {
  ModalidadeTipoCalendario,
  ROTAS,
  type PermissoesTela,
} from "../../core/constantes";
import { definirBreadcrumbManual, verificaSomenteConsulta } from "../../core/sessao";
import { useRotaCalendario } from "../../core/endereco";
import { abrangenciaService } from "../../services/abrangenciaService";
import {
  calendarioService,
  type CadastroTipoCalendario,
  type TipoCalendarioDetalhe,
} from "../../services/calendarioService";
import type { RootState } from "../../types/redux";

type ValoresFormulario = {
  nome: string;
  anoLetivo: string | number;
  modalidade: string;
  periodo: string | number;
  situacao: boolean;
  semestre: string | number;
};

type AuditoriaTipo = Pick<
  TipoCalendarioDetalhe,
  "criadoPor" | "criadoEm" | "alteradoPor" | "alteradoEm"
> & {
  criadoRf?: string;
  alteradoRf?: string;
};

const valoresVazios: ValoresFormulario = {
  nome: "",
  anoLetivo: "",
  modalidade: "",
  periodo: "",
  situacao: true,
  semestre: "",
};

const opcoesModalidade = [
  { value: ModalidadeTipoCalendario.FUNDAMENTAL_MEDIO, label: "Fundamental/Médio" },
  { value: ModalidadeTipoCalendario.EJA, label: "EJA" },
  { value: ModalidadeTipoCalendario.INFANTIL, label: "Infantil" },
  { value: ModalidadeTipoCalendario.CELP, label: "CELP" },
];

const modalidadesComSemestre: number[] = [
  ModalidadeTipoCalendario.EJA,
  ModalidadeTipoCalendario.CELP,
];

const esquemaFormulario = Yup.object({
  nome: Yup.string().required("Nome obrigatório").max(50, "Máximo 50 caracteres"),
  anoLetivo: Yup.mixed().required("Ano obrigatório"),
  modalidade: Yup.string().required("Modalidade obrigatória"),
  periodo: Yup.mixed().required("Período obrigatório"),
  situacao: Yup.boolean().required("Situação obrigatória"),
  semestre: Yup.mixed().when("modalidade", {
    is: (modalidade: string) => modalidadesComSemestre.includes(Number(modalidade)),
    then: (schema) => schema.required("Semestre obrigatório"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const erroCampo = (form: FormikProps<ValoresFormulario>, campo: keyof ValoresFormulario) =>
  form.touched[campo] ? form.errors[campo] : undefined;

const InicializarAnoLetivo = ({
  anos,
  carregando,
  anoLetivoFallback,
}: {
  anos: Array<string | number>;
  carregando: boolean;
  anoLetivoFallback?: number;
}) => {
  const { values, setFieldValue } = useFormikContext<ValoresFormulario>();

  useEffect(() => {
    if (carregando || values.anoLetivo || !anos.length) return;
    void setFieldValue("anoLetivo", anoLetivoFallback || anos[0], false);
  }, [anoLetivoFallback, anos, carregando, setFieldValue, values.anoLetivo]);

  return null;
};

const TipoCalendarioCadastro = () => {
  const { id } = useRotaCalendario();
  const location = useLocation();
  const navigate = useNavigate();
  const usuario = useSelector((state: RootState) => state.usuario);
  const permissoes =
    usuario.permissoes?.[ROTAS.TIPO_CALENDARIO_ESCOLAR] as PermissoesTela | undefined;
  const editando = !!id;
  const [somenteConsulta, setSomenteConsulta] = useState(false);
  const [valoresIniciais, setValoresIniciais] = useState(valoresVazios);
  const [anosLetivos, setAnosLetivos] = useState<Array<string | number>>([]);
  const [carregandoDados, setCarregandoDados] = useState(editando);
  const [carregandoAnos, setCarregandoAnos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [possuiEventos, setPossuiEventos] = useState(false);
  const [auditoria, setAuditoria] = useState<AuditoriaTipo>({});

  const permissaoParaEditar = editando
    ? !!permissoes?.podeAlterar
    : !!permissoes?.podeIncluir;
  const camposDesabilitados = somenteConsulta || !permissaoParaEditar;
  const excluirDesabilitado =
    somenteConsulta ||
    !permissoes?.podeExcluir ||
    !editando ||
    possuiEventos;

  useEffect(() => {
    setSomenteConsulta(verificaSomenteConsulta(permissoes));
  }, [permissoes]);

  useEffect(() => {
    if (!editando) return;

    definirBreadcrumbManual(
      location.pathname,
      "Alterar Tipo de Calendário Escolar",
      ROTAS.TIPO_CALENDARIO_ESCOLAR,
    );
    let ativo = true;
    setCarregandoDados(true);
    calendarioService
      .obterTipoCalendario(id)
      .then(({ data }) => {
        if (!ativo) return;
        setValoresIniciais({
          nome: data.nome || "",
          anoLetivo: data.anoLetivo || "",
          modalidade: String(data.modalidade ?? ""),
          periodo: data.periodo ?? "",
          situacao: data.situacao,
          semestre: data.semestre ?? "",
        });
        setPossuiEventos(!!data.possuiEventos);
        setAuditoria({
          criadoPor: data.criadoPor,
          criadoRf: data.criadoRF && data.criadoRF > 0 ? String(data.criadoRF) : "",
          criadoEm: data.criadoEm,
          alteradoPor: data.alteradoPor,
          alteradoRf:
            data.alteradoRF && data.alteradoRF > 0
              ? String(data.alteradoRF)
              : "",
          alteradoEm: data.alteradoEm,
        });
      })
      .catch((falha) => exibirErrosApi(falha, usuario.logado))
      .finally(() => {
        if (ativo) setCarregandoDados(false);
      });

    return () => {
      ativo = false;
    };
  }, [editando, id, location.pathname, usuario.logado]);

  useEffect(() => {
    if (editando) return;
    let ativo = true;
    setCarregandoAnos(true);
    abrangenciaService
      .buscarTodosAnosLetivos()
      .then(({ data }) => {
        if (!ativo) return;
        const anos = Array.isArray(data) ? data : [];
        setAnosLetivos(anos);
      })
      .catch((falha) => exibirErrosApi(falha, usuario.logado))
      .finally(() => {
        if (ativo) setCarregandoAnos(false);
      });

    return () => {
      ativo = false;
    };
  }, [editando, usuario.logado, usuario.turmaSelecionada?.anoLetivo]);

  const anosOptions = useMemo(
    () => anosLetivos.map((ano) => ({ valor: ano, desc: String(ano) })),
    [anosLetivos],
  );
  const modalidadesOptions = useMemo(
    () => opcoesModalidade.map((opcao) => ({ ...opcao, value: String(opcao.value) })),
    [],
  );

  const salvar = async (valores: ValoresFormulario) => {
    const semestreObrigatorio = modalidadesComSemestre.includes(
      Number(valores.modalidade),
    );
    if (semestreObrigatorio && !valores.semestre) {
      erro("Informe o Semestre");
      return;
    }

    const dados: CadastroTipoCalendario = {
      id: id || 0,
      anoLetivo: valores.anoLetivo,
      nome: valores.nome,
      modalidade: valores.modalidade,
      periodo: semestreObrigatorio ? 2 : Number(valores.periodo),
      situacao: valores.situacao,
      semestre: semestreObrigatorio ? valores.semestre : null,
    };

    setSalvando(true);
    try {
      await calendarioService.salvarTipoCalendario(dados);
      sucesso("Suas informações foram salvas com sucesso.");
      navigate(ROTAS.TIPO_CALENDARIO_ESCOLAR);
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (excluirDesabilitado) return;
    const confirmado = await confirmar(
      "Excluir tipo de calendário escolar",
      "",
      "Deseja realmente excluir este calendário?",
      "Excluir",
      "Cancelar",
    );
    if (!confirmado) return;

    try {
      await calendarioService.excluirTiposCalendario([id]);
      sucesso("Tipo de calendário excluído com sucesso.");
      navigate(ROTAS.TIPO_CALENDARIO_ESCOLAR);
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
    }
  };

  const cancelar = async (form: FormikProps<ValoresFormulario>) => {
    if (!modoEdicao) return;
    const confirmado = await confirmar(
      "Atenção",
      "Você não salvou as informações preenchidas.",
      "Deseja realmente cancelar as alterações?",
    );
    if (confirmado) {
      form.resetForm();
      setModoEdicao(false);
    }
  };

  const voltar = async (form: FormikProps<ValoresFormulario>) => {
    if (!modoEdicao) {
      navigate(ROTAS.TIPO_CALENDARIO_ESCOLAR);
      return;
    }
    const confirmado = await confirmar(
      "Atenção",
      "",
      "Suas alterações não foram salvas, deseja salvar agora?",
    );
    if (confirmado) await form.submitForm();
    else navigate(ROTAS.TIPO_CALENDARIO_ESCOLAR);
  };

  return (
    <Formik
      enableReinitialize
      initialValues={valoresIniciais}
      validationSchema={esquemaFormulario}
      onSubmit={salvar}
    >
      {(form) => {
        const semestreObrigatorio = modalidadesComSemestre.includes(
          Number(form.values.modalidade),
        );
        const textoErro = (campo: keyof ValoresFormulario) => {
          const mensagem = erroCampo(form, campo);
          return mensagem ? <div className="campo-erro">{mensagem}</div> : null;
        };
        const alterar = (campo: keyof ValoresFormulario, valor: string | number | boolean) => {
          void form.setFieldValue(campo, valor);
          void form.setFieldTouched(campo, true, false);
          setModoEdicao(true);
        };

        return (
          <Loader loading={carregandoDados || salvando}>
            <>
              <InicializarAnoLetivo
                anos={anosLetivos}
                carregando={carregandoAnos}
                anoLetivoFallback={usuario.turmaSelecionada?.anoLetivo}
              />
              <Cabecalho
                pagina={`${editando ? "Alterar" : "Cadastro do"} Tipo de Calendário Escolar`}
              >
                <Row gutter={[8, 8]}>
                  <Col>
                    <BotaoVoltar onClick={() => void voltar(form)} />
                  </Col>
                  <Col>
                    <Botao
                      id="SGP_BUTTON_CANCELAR"
                      label="Cancelar"
                      disabled={!modoEdicao || camposDesabilitados}
                      onClick={() => void cancelar(form)}
                    />
                  </Col>
                  <Col>
                    <BotaoExcluir
                      disabled={excluirDesabilitado}
                      onClick={() => void excluir()}
                    />
                  </Col>
                  <Col>
                    <Botao
                      id="SGP_BUTTON_ALTERAR_CADASTRAR"
                      label={editando ? "Alterar" : "Cadastrar"}
                      disabled={
                        camposDesabilitados ||
                        (editando && !modoEdicao) ||
                        carregandoDados
                      }
                      onClick={() => {
                        Object.keys(valoresVazios).forEach((campo) => {
                          void form.setFieldTouched(campo, true, false);
                        });
                        void form.submitForm();
                      }}
                    />
                  </Col>
                </Row>
              </Cabecalho>
              <section className="calendario-card">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={6} lg={4}>
                    <Loader loading={carregandoAnos}>
                      <SelectCampo
                        id="drop-ano-letivo-rel-pendencias"
                        label="Ano"
                        lista={anosOptions}
                        valueOption="valor"
                        valueText="desc"
                        value={String(form.values.anoLetivo)}
                        disabled={editando || camposDesabilitados || anosLetivos.length === 1}
                        onChange={(valor) => {
                          if (typeof valor === "string") alterar("anoLetivo", valor);
                        }}
                        placeholder="Ano"
                        labelRequired
                        erro={textoErro("anoLetivo") ? "Ano obrigatório" : undefined}
                      />
                    </Loader>
                  </Col>
                  <Col xs={24} md={12} lg={10}>
                    <div className={textoErro("nome") ? "campo-invalido" : undefined}>
                      <label className="campo-label" htmlFor="nome">
                        Nome do calendário
                        <span className="campo-obrigatorio">*</span>
                      </label>
                      <Input
                        id="nome"
                        maxLength={50}
                        value={form.values.nome}
                        disabled={camposDesabilitados}
                        onChange={(evento) => alterar("nome", evento.target.value)}
                        onBlur={() => void form.setFieldTouched("nome", true)}
                      />
                      {textoErro("nome")}
                    </div>
                  </Col>
                  <Col xs={24} md={6} lg={5}>
                    <div className={textoErro("situacao") ? "campo-invalido" : undefined}>
                      <label className="campo-label">
                        Situação<span className="campo-obrigatorio">*</span>
                      </label>
                      <Radio.Group
                        value={form.values.situacao}
                        disabled={camposDesabilitados}
                        onChange={(evento) => alterar("situacao", evento.target.value)}
                        options={[
                          { label: "Ativo", value: true },
                          { label: "Inativo", value: false },
                        ]}
                      />
                      {textoErro("situacao")}
                    </div>
                  </Col>
                  <Col xs={24} md={8} lg={5}>
                    <div className={textoErro("periodo") ? "campo-invalido" : undefined}>
                      <label className="campo-label">
                        Período<span className="campo-obrigatorio">*</span>
                      </label>
                      <Radio.Group
                        value={form.values.periodo}
                        disabled={
                          camposDesabilitados ||
                          possuiEventos ||
                          semestreObrigatorio
                        }
                        onChange={(evento) => alterar("periodo", evento.target.value)}
                        options={[
                          { label: "Anual", value: 1 },
                          { label: "Semestral", value: 2 },
                        ]}
                      />
                      {textoErro("periodo")}
                    </div>
                  </Col>
                  <Col xs={24} md={8} lg={5}>
                    <SelectCampo
                      id="semestre"
                      label="Semestre"
                      lista={[
                        { valor: 1, descricao: "1" },
                        { valor: 2, descricao: "2" },
                      ]}
                      valueOption="valor"
                      valueText="descricao"
                      value={String(form.values.semestre)}
                      disabled={!semestreObrigatorio || camposDesabilitados}
                      onChange={(valor) => {
                        if (typeof valor === "string") alterar("semestre", valor);
                      }}
                      placeholder="Semestre"
                      labelRequired={semestreObrigatorio}
                      erro={textoErro("semestre") ? "Semestre obrigatório" : undefined}
                    />
                  </Col>
                  <Col xs={24} md={12} lg={10}>
                    <SelectCampo
                      id="modalidade"
                      label="Modalidade"
                      lista={modalidadesOptions}
                      valueOption="value"
                      valueText="label"
                      value={form.values.modalidade}
                      disabled={camposDesabilitados || possuiEventos}
                      onChange={(valor) => {
                        void form.setFieldValue("semestre", "");
                        void form.setFieldValue("periodo", "");
                        void form.setFieldTouched("periodo", false, false);
                        void form.setFieldValue(
                          "modalidade",
                          typeof valor === "string" ? valor : "",
                        );
                        void form.setFieldTouched("modalidade", true, false);
                        if (
                          typeof valor === "string" &&
                          modalidadesComSemestre.includes(Number(valor))
                        ) {
                          void form.setFieldValue("periodo", 2);
                        }
                        setModoEdicao(true);
                      }}
                      placeholder="Selecione uma modalidade"
                      labelRequired
                      erro={
                        textoErro("modalidade")
                          ? "Modalidade obrigatória"
                          : undefined
                      }
                    />
                  </Col>
                </Row>
                {editando && (
                  <Auditoria
                    criadoEm={auditoria.criadoEm}
                    criadoPor={auditoria.criadoPor}
                    criadoRf={auditoria.criadoRf}
                    alteradoEm={auditoria.alteradoEm}
                    alteradoPor={auditoria.alteradoPor}
                    alteradoRf={auditoria.alteradoRf}
                  />
                )}
              </section>
            </>
          </Loader>
        );
      }}
    </Formik>
  );
};

export default TipoCalendarioCadastro;
