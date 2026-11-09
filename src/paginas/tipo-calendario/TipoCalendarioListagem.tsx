import { Col, Row, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import BotaoExcluirPadrao from "../../componentes/ui/BotaoExcluirPadrao";
import { Botao, BotaoVoltar } from "../../componentes/ui/Botao";
import { Cabecalho } from "../../componentes/ui/Cabecalho";
import { confirmar, exibirErrosApi, sucesso } from "../../core/config/alertas";
import { ROTAS, URL_HOME, type TipoCalendario } from "../../core/constantes";
import { verificaSomenteConsulta } from "../../core/sessao";
import { calendarioService } from "../../services/calendarioService";
import type { RootState } from "../../types/redux";

type TipoCalendarioLista = TipoCalendario & {
  nome?: string;
  descricaoPeriodo?: string;
};

const colunas: ColumnsType<TipoCalendarioLista> = [
  {
    title: "Nome do tipo de calendário",
    dataIndex: "nome",
  },
  {
    title: "Ano",
    dataIndex: "anoLetivo",
  },
  {
    title: "Período",
    dataIndex: "descricaoPeriodo",
  },
];

const TipoCalendarioListagem = () => {
  const usuario = useSelector((state: RootState) => state.usuario);
  const navigate = useNavigate();
  const permissoesTela = usuario.permissoes?.[ROTAS.TIPO_CALENDARIO_ESCOLAR];
  const [somenteConsulta, setSomenteConsulta] = useState(false);
  const [idTiposSelecionados, setIdTiposSelecionados] = useState<
    Array<string | number>
  >([]);
  const [listaTiposCalendarioEscolar, setListaTiposCalendarioEscolar] =
    useState<TipoCalendarioLista[]>([]);
  const [carregando, setCarregando] = useState(false);

  const onFiltrar = useCallback(async () => {
    setIdTiposSelecionados([]);
    setCarregando(true);
    try {
      const resposta = await calendarioService.listarTiposCalendario();
      setListaTiposCalendarioEscolar(resposta.data);
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
    } finally {
      setCarregando(false);
    }
  }, [usuario.logado]);

  useEffect(() => {
    void onFiltrar();
  }, [onFiltrar]);

  useEffect(() => {
    setSomenteConsulta(verificaSomenteConsulta(permissoesTela));
  }, [permissoesTela]);

  const onClickExcluir = async () => {
    const listaParaExcluir = listaTiposCalendarioEscolar.filter((tipo) =>
      idTiposSelecionados.some((id) => Number(id) === Number(tipo.id)),
    );
    const listaNomeExcluir = listaParaExcluir
      .map((item) => item.nome)
      .filter((nome): nome is string => !!nome)
      .join(", ");
    const confirmado = await confirmar(
      "Excluir tipo de calendário escolar",
      listaNomeExcluir,
      `Deseja realmente excluir ${
        idTiposSelecionados.length > 1 ? "estes calendários" : "este calendário"
      }?`,
      "Excluir",
      "Cancelar",
    );
    if (!confirmado) return;

    try {
      await calendarioService.excluirTiposCalendario(idTiposSelecionados);
      sucesso(
        `${
          idTiposSelecionados.length > 1 ? "Tipos" : "Tipo"
        } de calendário excluído com sucesso.`,
      );
      await onFiltrar();
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
    }
  };

  return (
    <>
      <Cabecalho pagina="Tipo de calendário escolar">
        <Row gutter={[8, 8]}>
          <Col>
            <BotaoVoltar onClick={() => navigate(URL_HOME)} />
          </Col>
          <Col>
            <BotaoExcluirPadrao
              disabled={!permissoesTela?.podeExcluir || idTiposSelecionados.length < 1}
              onClick={onClickExcluir}
            />
          </Col>
          <Col>
            <Botao
              id="SGP_BUTTON_NOVO"
              label="Novo"
              cor="roxo"
              onClick={() =>
                navigate(`${ROTAS.TIPO_CALENDARIO_ESCOLAR}/novo`)
              }
              disabled={somenteConsulta || !permissoesTela?.podeIncluir}
            />
          </Col>
        </Row>
      </Cabecalho>
      <div className="calendario-card">
        <Table<TipoCalendarioLista>
          id="lista-tipo-calendario"
          rowKey="id"
          bordered
          size="middle"
          loading={carregando}
          locale={{ emptyText: "Sem dados" }}
          columns={colunas}
          dataSource={listaTiposCalendarioEscolar}
          rowSelection={{
            selectedRowKeys: idTiposSelecionados,
            onChange: (ids) =>
              setIdTiposSelecionados(
                ids.filter(
                  (id): id is string | number =>
                    typeof id === "string" || typeof id === "number",
                ),
              ),
          }}
          onRow={(tipo) => ({
            onClick: (evento) => {
              const alvo = evento.target;
              if (
                alvo instanceof HTMLElement &&
                alvo.closest(".ant-table-selection-column")
              ) {
                return;
              }
              navigate(
                `${ROTAS.TIPO_CALENDARIO_ESCOLAR}/editar/${tipo.id}`,
              );
            },
          })}
          pagination={{ locale: { items_per_page: "" } }}
        />
      </div>
    </>
  );
};

export default TipoCalendarioListagem;
