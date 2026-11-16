import { ROTAS } from '~/core/constantes';
import { Col, Radio, Row } from 'antd';
import { Form, Formik, type FormikProps } from 'formik';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import { Auditoria } from '~/componentes/ui/Auditoria';
import { Label } from '~/componentes/ui/Label';
import { Cabecalho } from '~/componentes/ui/Cabecalho';
import BotaoExcluirPadrao from '~/componentes/ui/BotaoExcluirPadrao';
import { BotaoVoltar, Botao } from '~/componentes/ui/Botao';
import { CampoTexto, type TFormulario } from '~/componentes/ui/CampoTexto';
import { SelectCampo } from '~/componentes/ui/SelectCampo';
import { definirBreadcrumbManual } from '~/core/sessao';
import { confirmar, sucesso } from '~/core/config/alertas';
import { mockTipoEventos } from '~/mocks/mockTipoEventos';

type IEventoFormulario = {
  descricao: string;
  letivo: string | undefined;
  localOcorrencia: string | undefined;
  concomitancia: boolean;
  tipoData: number;
  dependencia: boolean;
  ativo: boolean;
}

export type TFormFormik = FormikProps<Record<string, unknown>>;

export const TipoEventosFormulario = () => {
  const navigate = useNavigate();
  const paramsRoute = useParams();
  const location = useLocation();

  const idTipoEvento = paramsRoute?.id;

  const [valoresIniciais, setValoresIniciais] = useState<IEventoFormulario>({} as IEventoFormulario);
  const [dadosTipoEvento, setDadosTipoEvento] = useState<IEventoFormulario>({
    descricao: '',
    letivo: undefined,
    localOcorrencia: undefined,
    concomitancia: true,
    tipoData: 1,
    dependencia: true,
    ativo: true,
  });
  const [modoEdicao, setModoEdicao] = useState(false);
  const [inseridoAlterado, setInseridoAlterado] = useState<any>({});

  const listaLetivo = [
    { valor: 1, descricao: 'Sim' },
    { valor: 2, descricao: 'Não' },
    { valor: 3, descricao: 'Opcional' },
  ];

  const listaLocalOcorrencia = [
    { valor: 1, descricao: 'UE' },
    { valor: 2, descricao: 'DRE' },
    { valor: 3, descricao: 'SME' },
    { valor: 4, descricao: 'SME/UE' },
    { valor: 5, descricao: 'Todos' },
  ];

  const [possuiEventos, setPossuiEventos] = useState(false);

  useEffect(() => {
    if (idTipoEvento) {
      const resposta = mockTipoEventos.find((item) => item.id === Number(idTipoEvento));

      if (!resposta) {
        navigate(ROTAS.TIPO_EVENTOS);
        return;
      }

      const data: IEventoFormulario = {
        descricao: resposta.descricao,
        letivo: resposta.letivo.toString(),
        localOcorrencia: resposta.localOcorrencia.toString(),
        concomitancia: resposta.concomitancia,
        tipoData: resposta.tipoData,
        dependencia: resposta.dependencia,
        ativo: resposta.ativo,
      };

      setDadosTipoEvento(data);
      setInseridoAlterado({ ...data });
      setPossuiEventos(false);
      setValoresIniciais({ ...data });
    }
  }, [idTipoEvento]);

  useEffect(() => {
    if (idTipoEvento) {
      definirBreadcrumbManual(
        location.pathname,
        'Alteração de Tipo de Eventos',
        `${ROTAS.TIPO_EVENTOS}`
      );
    }
  }, [idTipoEvento, location]);

  const resetarTela = (form: TFormFormik) => {
    if (idTipoEvento) {
      form.resetForm();
      setDadosTipoEvento({ ...valoresIniciais });
    } else {
      form.resetForm();
      setDadosTipoEvento({
        descricao: '',
        letivo: undefined,
        localOcorrencia: undefined,
        concomitancia: true,
        tipoData: 1,
        dependencia: true,
        ativo: true,
      });
    }
    setModoEdicao(false);
  };

  const clicouBotaoCancelar = async (form: TFormFormik) => {
    const confirmou = await confirmar(
      'Atenção',
      'Você não salvou as informações preenchidas.',
      'Deseja realmente cancelar as alterações?'
    );
    if (confirmou) {
      resetarTela(form);
    }
  };

  const clicouBotaoExcluir = async () => {
    if (idTipoEvento) {
      const confirmado = await confirmar(
        'Excluir tipo de calendário escolar',
        '',
        'Deseja realmente excluir este calendário?',
        'Excluir',
        'Cancelar'
      );
      if (confirmado) {
        sucesso('Tipo de evento deletado com sucesso!');
        navigate(ROTAS.TIPO_EVENTOS);
      }
    }
  };

  const [validacoes] = useState(
    Yup.object({
      descricao: Yup.string().required('Digite o nome do tipo de evento'),
      localOcorrencia: Yup.string().required(
        'Selecione um local de ocorrência'
      ),
      letivo: Yup.string().required('Selecione um letivo'),
    })
  );

  const clicouBotaoCadastrar = async (form: TFormFormik) => {
    await form.validateForm().then(() => form.handleSubmit());
  };

  const clicouBotaoVoltar = async (form: TFormFormik) => {
    if (modoEdicao) {
      const confirmado = await confirmar(
        'Atenção',
        '',
        'Suas alterações não foram salvas, deseja salvar agora?'
      );
      if (confirmado) {
        await clicouBotaoCadastrar(form);
      } else {
        navigate(ROTAS.TIPO_EVENTOS);
      }
    } else {
      navigate(ROTAS.TIPO_EVENTOS);
    }
  };

  const cadastrarTipoEvento = (_: any) => {
    sucesso(
      `Tipo de evento ${idTipoEvento ? 'atualizado' : 'cadastrado'
      } com sucesso!`
    );
    navigate(ROTAS.TIPO_EVENTOS);
  };

  return (
    <Formik
      enableReinitialize
      initialValues={dadosTipoEvento}
      onSubmit={dados => cadastrarTipoEvento(dados)}
      validationSchema={validacoes}
      validateOnBlur={false}
      validateOnChange={false}
    >
      {(form: TFormulario) => {
        const alterar = (campo: keyof IEventoFormulario, valor: string | number | boolean) => {
          void form.setFieldValue(campo, valor);
          void form.setFieldTouched(campo, true, false);
          setModoEdicao(true);
        };

        return (
          <>
            <Cabecalho
              pagina={`${idTipoEvento ? 'Alteração' : 'Cadastro'
                } de Tipo de Eventos`}
            >
              <Row gutter={[8, 8]}>
                <Col>
                  <BotaoVoltar onClick={() => clicouBotaoVoltar(form)} />
                </Col>
                <Col>
                  <Botao
                    id="SGP_BUTTON_CANCELAR"
                    label="Cancelar"
                    onClick={() => clicouBotaoCancelar(form)}
                    disabled={!modoEdicao}
                  />
                </Col>
                <Col>
                  <BotaoExcluirPadrao
                    disabled={possuiEventos || !idTipoEvento}
                    onClick={clicouBotaoExcluir}
                  />
                </Col>
                <Col>
                  <Botao
                    id="SGP_BUTTON_ALTERAR_CADASTRAR"
                    label={idTipoEvento ? 'Alterar' : 'Cadastrar'}
                    onClick={() => clicouBotaoCadastrar(form)}
                    disabled={!!idTipoEvento && !modoEdicao}
                  />
                </Col>
              </Row>
            </Cabecalho>

            <section className="calendario-card">
              <div>
                <Form>
                  <div className="div-tipo-evento-formulario row mb-4">
                    <div className="col-6">
                      <CampoTexto
                        form={form}
                        name="descricao"
                        id="descricao"
                        maxlength={100}
                        placeholder="Nome do evento"
                        desabilitado={possuiEventos}
                        label="Nome do tipo de evento"
                        labelRequired
                        rows={1}
                        onChange={() => setModoEdicao(true)}
                      />
                    </div>
                    <div className="div-tipo-evento-formulario col-4">
                      <SelectCampo
                        id="localOcorrencia"
                        placeholder="Local de ocorrência"
                        valueOption="valor"
                        valueText="descricao"
                        lista={listaLocalOcorrencia}
                        value={form.values.localOcorrencia as string}
                        onChange={(valor) => {
                          if (typeof valor === "string") alterar("localOcorrencia", valor);
                        }}
                        disabled={possuiEventos}
                        label="Local de ocorrência"
                        labelRequired
                      />
                    </div>
                    <div className="div-tipo-evento-formulario col-2">
                      <SelectCampo
                        id="letivo"
                        placeholder="Tipo"
                        valueOption="valor"
                        valueText="descricao"
                        lista={listaLetivo}
                        value={form.values.letivo as string}
                        onChange={(valor) => {
                          if (typeof valor === "string") alterar("letivo", valor);
                        }}
                        disabled={possuiEventos}
                        label="Letivo"
                        labelRequired
                      />
                    </div>
                  </div>
                  <div className="div-tipo-evento-formulario row">
                    <div className="div-tipo-evento-formulario col-3">
                      <Label control="concomitancia" isRequired text="Permite concomitância" />
                    </div>
                    <div className="div-tipo-evento-formulario col-3">
                      <Label control="tipoData" isRequired text="Tipo de data" />
                    </div>
                    <div className="div-tipo-evento-formulario col-3">
                      <Label control="dependencia" isRequired text="Dependência" />
                    </div>
                    <div className="div-tipo-evento-formulario col-3">
                      <Label control="situacao" isRequired text="Situação" />
                    </div>
                  </div>
                  <div className="div-tipo-evento-formulario row">
                    <div className="div-tipo-evento-formulario col-3">
                      <Radio.Group
                        value={form.values.concomitancia}
                        onChange={(evento) => alterar("concomitancia", evento.target.value)}
                        disabled={possuiEventos}
                      >
                        <div className="div-tipo-evento-formulario form-check form-check-inline">
                          <Radio value>Sim</Radio>
                        </div>
                        <div className="div-tipo-evento-formulario form-check form-check-inline">
                          <Radio value={false}>Não</Radio>
                        </div>
                      </Radio.Group>
                    </div>
                    <div className="div-tipo-evento-formulario col-3">
                      <Radio.Group
                        value={form.values.tipoData}
                        onChange={(evento) => alterar("tipoData", evento.target.value)}
                        disabled={possuiEventos}
                      >
                        <div className="div-tipo-evento-formulario form-check form-check-inline">
                          <Radio value={1}>Única</Radio>
                        </div>
                        <div className="div-tipo-evento-formulario form-check form-check-inline">
                          <Radio value={2}>Início e fim</Radio>
                        </div>
                      </Radio.Group>
                    </div>
                    <div className="div-tipo-evento-formulario col-3">
                      <Radio.Group
                        value={form.values.dependencia}
                        onChange={(evento) => alterar("dependencia", evento.target.value)}
                        disabled={possuiEventos}
                      >
                        <div className="div-tipo-evento-formulario form-check form-check-inline">
                          <Radio value>Sim</Radio>
                        </div>
                        <div className="div-tipo-evento-formulario form-check form-check-inline">
                          <Radio value={false}>Não</Radio>
                        </div>
                      </Radio.Group>
                    </div>
                    <div className="div-tipo-evento-formulario col-3">
                      <Radio.Group
                        value={form.values.ativo}
                        onChange={(evento) => alterar("ativo", evento.target.value)}
                      >
                        <div className="div-tipo-evento-formulario form-check form-check-inline">
                          <Radio value>Ativo</Radio>
                        </div>
                        <div className="div-tipo-evento-formulario form-check form-check-inline">
                          <Radio value={false}>Inativo</Radio>
                        </div>
                      </Radio.Group>
                    </div>
                  </div>
                </Form>
              </div>
              <Auditoria
                {...inseridoAlterado}
                criadoRf={inseridoAlterado?.criadoRF}
                alteradoRf={inseridoAlterado?.alteradoRF}
              />
            </section>
          </>
        )
      }}
    </Formik>
  );
};
