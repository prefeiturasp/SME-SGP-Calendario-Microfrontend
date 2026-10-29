import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Row } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDestino } from "../../core/endereco";
import { Botao, BotaoExcluir, BotaoVoltar } from "../../componentes/ui/Botao";
import { Cabecalho } from "../../componentes/ui/Cabecalho";
import { ListaPaginada } from "../../componentes/ui/ListaPaginada";
import { Loader } from "../../componentes/ui/Loader";
import { SelectAutocomplete } from "../../componentes/ui/SelectAutocomplete";
import { SelectCampo } from "../../componentes/ui/SelectCampo";
import { confirmar, exibirErrosApi, mensagemApi, sucesso } from "../../core/config/alertas";
import { OPCAO_TODOS, ROTAS, comoLista, ehEjaOuCelp, type TipoCalendario } from "../../core/constantes";
import { formatarDia } from "../../core/datas";
import { mesclarAbrangencias, ordenarPorNome, type Abrangencia } from "../../core/regras/reabertura";
import { verificaSomenteConsulta } from "../../core/sessao";
import { abrangenciaService } from "../../services/abrangenciaService";
import { calendarioService } from "../../services/calendarioService";
import { fechamentoReaberturaService } from "../../services/fechamentoReaberturaService";
import type { RootState } from "../../types/redux";

const ReaberturaLista = () => {
  const navigate = useDestino();
  const usuario = useSelector((state: RootState) => state.usuario);
  const permissoes = usuario.permissoes?.[ROTAS.PERIODO_FECHAMENTO_REABERTURA];
  const [somenteConsulta, setSomenteConsulta] = useState(false);
  const [calendarios, setCalendarios] = useState<TipoCalendario[]>([]);
  const [calendario, setCalendario] = useState<TipoCalendario | null>(null);
  const [dres, setDres] = useState<Abrangencia[]>([]);
  const [ues, setUes] = useState<Abrangencia[]>([]);
  const [codigoDre, setCodigoDre] = useState<string>();
  const [codigoUe, setCodigoUe] = useState<string>();
  const [carregandoCalendarios, setCarregandoCalendarios] = useState(false);
  const [carregandoDres, setCarregandoDres] = useState(false);
  const [carregandoUes, setCarregandoUes] = useState(false);
  const [selecionados, setSelecionados] = useState<Record<string, unknown>[]>([]);
  const [recarregar, setRecarregar] = useState(0);

  useEffect(() => {
    setSomenteConsulta(verificaSomenteConsulta(permissoes));
  }, [permissoes]);

  const buscarCalendarios = useCallback(
    async (descricao: string) => {
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
    void buscarCalendarios("");
  }, [buscarCalendarios]);

  useEffect(() => {
    if (!calendario?.id) {
      setCodigoDre(undefined);
      setDres([]);
      return;
    }
    let ativo = true;
    setCarregandoDres(true);
    abrangenciaService
      .buscarDres()
      .then((resposta) => {
        if (!ativo) return;
        const lista = comoLista<Abrangencia>(resposta.data).sort(ordenarPorNome("nome"));
        if (lista.length === 1) setCodigoDre(lista[0].codigo);
        if (usuario.possuiPerfilSme && lista.length > 1) {
          lista.unshift({ codigo: OPCAO_TODOS, nome: "Todas" });
          setCodigoDre(OPCAO_TODOS);
        }
        setDres(lista);
      })
      .catch((falha) => {
        exibirErrosApi(falha, usuario.logado);
        setDres([]);
        setCodigoDre(undefined);
      })
      .finally(() => {
        if (ativo) setCarregandoDres(false);
      });
    return () => {
      ativo = false;
    };
  }, [calendario?.id, usuario.possuiPerfilSme, usuario.logado]);

  useEffect(() => {
    if (!codigoDre || !calendario?.id) {
      setUes([]);
      setCodigoUe(undefined);
      return;
    }
    if (codigoDre === OPCAO_TODOS) {
      setUes([{ codigo: OPCAO_TODOS, nome: "Todas" }]);
      setCodigoUe(OPCAO_TODOS);
      return;
    }

    let ativo = true;
    const modalidade = calendarioService.converterModalidade(calendario.modalidade) || 0;
    setCarregandoUes(true);
    Promise.all([
      abrangenciaService.buscarUes(codigoDre, modalidade, false, calendario.anoLetivo),
      abrangenciaService.buscarUes(codigoDre, modalidade, true, calendario.anoLetivo),
    ])
      .then(([atuais, historicas]) => {
        if (!ativo) return;
        const lista = mesclarAbrangencias(atuais.data, historicas.data).sort(ordenarPorNome("nome"));
        if (lista.length === 1) setCodigoUe(lista[0].codigo);
        if (usuario.possuiPerfilSmeOuDre && lista.length > 1) {
          lista.unshift({ codigo: OPCAO_TODOS, nome: "Todas" });
          setCodigoUe(OPCAO_TODOS);
        }
        setUes(lista);
      })
      .catch((falha) => {
        exibirErrosApi(falha, usuario.logado);
        setUes([]);
        setCodigoUe(undefined);
      })
      .finally(() => {
        if (ativo) setCarregandoUes(false);
      });
    return () => {
      ativo = false;
    };
  }, [codigoDre, calendario, usuario.possuiPerfilSmeOuDre, usuario.logado]);

  const excluir = async () => {
    if (!selecionados.length) return;
    const confirmou = await confirmar(
      "Excluir Fechamento(s)",
      "",
      "Você tem certeza que deseja excluir este(s) registros(s)?",
      "Excluir",
      "Cancelar",
    );
    if (!confirmou) return;
    try {
      const resposta = await fechamentoReaberturaService.deletar(
        selecionados.map((item) => item.id as string | number),
      );
      if (resposta.status === 200) {
        sucesso(mensagemApi(resposta.data, "Registro excluído com sucesso."));
        setSelecionados([]);
        setRecarregar((valor) => valor + 1);
      }
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
    }
  };

  const colunasBimestre = Array.from({ length: ehEjaOuCelp(calendario?.modalidade) ? 2 : 4 }, (_, indice) => ({
    title: String(indice + 1),
    dataIndex: "bimestres",
    key: String(indice + 1),
    render: (bimestres: boolean[]) =>
      bimestres?.[indice] ? (
        <span className="bimestre-ok">
          <FontAwesomeIcon icon={faCheck} className="" />
        </span>
      ) : null,
  }));

  const colunas: ColumnsType<Record<string, unknown>> = [
    { title: "Descrição", dataIndex: "descricao", width: "65%" },
    {
      title: "Início",
      dataIndex: "dataInicio",
      width: "15%",
      render: (data: string) => formatarDia(data),
    },
    {
      title: "Fim",
      dataIndex: "dataFim",
      width: "15%",
      render: (data: string) => formatarDia(data),
    },
    { title: "Bimestres", children: colunasBimestre },
  ];

  const filtroValido = !!(calendario?.id && codigoDre && codigoUe);
  const filtro = {
    tipoCalendarioId: calendario?.id,
    dreCodigo: codigoDre === OPCAO_TODOS ? "" : codigoDre,
    ueCodigo: codigoUe === OPCAO_TODOS ? "" : codigoUe,
    consulta: recarregar,
  };

  return (
    <>
      <Cabecalho pagina="Período de Fechamento (Reabertura)">
        <BotaoVoltar onClick={() => navigate("/")} />
        <BotaoExcluir
          disabled={!permissoes?.podeExcluir || !selecionados.length}
          onClick={() => void excluir()}
        />
        <Botao
          id="SGP_BUTTON_NOVO"
          label="Novo"
          disabled={somenteConsulta || !permissoes?.podeIncluir}
          onClick={() =>
            navigate(
              `${ROTAS.PERIODO_FECHAMENTO_REABERTURA}/novo/${calendario?.id || ""}`,
            )
          }
        />
      </Cabecalho>
      <section className="calendario-card">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div style={{ maxWidth: 420 }}>
            <Loader loading={carregandoCalendarios}>
              <SelectAutocomplete
                id="select-tipo-calendario"
                label="Calendário"
                placeholder="Selecione o calendário"
                lista={calendarios}
                value={calendario?.descricao || ""}
                onSelect={(texto) => {
                  const encontrado = calendarios.find((item) => item.descricao === texto);
                  setCalendario(encontrado || null);
                  setUes([]);
                  setCodigoUe(undefined);
                }}
                onChange={(texto) => {
                  const encontrado = calendarios.find((item) => item.descricao === texto);
                  setCalendario(encontrado || ({ descricao: texto } as TipoCalendario));
                }}
                handleSearch={(texto) => {
                  if (texto.length > 2 || texto.length === 0) void buscarCalendarios(texto);
                }}
              />
            </Loader>
            </div>
          </Col>
          <Col xs={24} xl={12}>
            <Loader loading={carregandoDres}>
              <SelectCampo
                id="dre"
                label="Diretoria Regional de Educação (DRE)"
                lista={dres}
                valueOption="codigo"
                valueText="nome"
                disabled={!calendario?.id || dres.length === 1}
                value={codigoDre}
                placeholder="Selecione uma DRE"
                showSearch
                carregando={carregandoDres}
                onChange={(valor) => {
                  setCodigoUe(undefined);
                  setUes([]);
                  setCodigoDre(String(valor));
                }}
              />
            </Loader>
          </Col>
          <Col xs={24} xl={12}>
            <Loader loading={carregandoUes}>
              <SelectCampo
                id="ue"
                label="Unidade Escolar (UE)"
                lista={ues}
                valueOption="codigo"
                valueText="nome"
                disabled={!codigoDre || ues.length === 1}
                value={codigoUe}
                placeholder="Selecione uma UE"
                showSearch
                carregando={carregandoUes}
                onChange={(valor) => setCodigoUe(String(valor))}
              />
            </Loader>
          </Col>
        </Row>
        {filtroValido && (
          <div style={{ marginTop: 20 }}>
            <ListaPaginada
              filtro={filtro}
              filtroEhValido={filtroValido}
              colunas={colunas}
              onSelecionar={setSelecionados}
              onClick={(item) =>
                navigate(`${ROTAS.PERIODO_FECHAMENTO_REABERTURA}/editar/${item.id}`)
              }
            />
          </div>
        )}
      </section>
    </>
  );
};

export default ReaberturaLista;
