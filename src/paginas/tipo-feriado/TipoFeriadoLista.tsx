import { Checkbox, Input, Select, Table } from "antd";
import type { RefSelectProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Botao, BotaoExcluir, BotaoVoltar } from "../../componentes/ui/Botao";
import { Cabecalho } from "../../componentes/ui/Cabecalho";
import { exibirErrosApi } from "../../core/config/alertas";
import { getAntdNotification } from "../../core/config/antd-static-api";
import { ROTAS, URL_HOME } from "../../core/constantes";
import { useDestino } from "../../core/endereco";
import { verificaSomenteConsulta } from "../../core/sessao";
import { ABRANGENCIAS_FERIADO, TIPOS_FERIADO } from "../../core/tipoFeriado";
import type {
  AbrangenciaFeriado,
  ConsultaTiposFeriado,
  PaginaTiposFeriado,
  TipoFeriado,
  TipoFeriadoResumo,
} from "../../core/tipoFeriado";
import { tipoFeriadoService } from "../../services/tipoFeriadoService";
import type { RootState } from "../../types/redux";
import "./tipo-feriado.css";

const consultaInicial: ConsultaTiposFeriado = {
  nome: "",
  abrangencia: 0,
  tipo: 0,
  pagina: 1,
  tamanhoPagina: 10,
};
const paginaVazia: PaginaTiposFeriado = { itens: [], total: 0 };
const avisarDemonstracao = () =>
  getAntdNotification()?.warning({
    message: "Ação demonstrativa",
    description: "Cadastro, edição e exclusão serão disponibilizados em próximas histórias.",
    duration: 6,
    className: "alerta-aviso",
  });

const TipoFeriadoLista = () => {
  const navigate = useDestino();
  const usuario = useSelector((state: RootState) => state.usuario);
  const permissoes = usuario.permissoes?.[ROTAS.TIPO_FERIADO];
  const podeConsultar = !!permissoes?.podeConsultar;
  const podeAlterar = podeConsultar && !!permissoes?.podeAlterar;
  const [consulta, setConsulta] = useState(consultaInicial);
  const [resposta, setResposta] = useState(paginaVazia);
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const abrangenciaRef = useRef<RefSelectProps>(null);
  const tipoRef = useRef<RefSelectProps>(null);

  useEffect(() => {
    verificaSomenteConsulta(permissoes);
  }, [permissoes]);

  useEffect(() => {
    if (!podeConsultar) {
      setResposta(paginaVazia);
      setSelecionadas([]);
      setCarregando(false);
      setFalhou(false);
      return;
    }
    let ativo = true;
    setCarregando(true);
    setFalhou(false);
    tipoFeriadoService
      .listar(consulta)
      .then((dados) => {
        if (ativo) setResposta(dados);
      })
      .catch((falha) => {
        if (!ativo) return;
        setResposta(paginaVazia);
        setFalhou(true);
        exibirErrosApi(falha, usuario.logado);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [consulta, podeConsultar, usuario.logado]);

  const filtrar = (
    alteracao: Partial<Pick<ConsultaTiposFeriado, "nome" | "abrangencia" | "tipo">>
  ) => {
    setSelecionadas([]);
    setConsulta((anterior) => ({ ...anterior, ...alteracao, pagina: 1 }));
  };
  const dados = podeConsultar ? resposta : paginaVazia;
  const chavesPagina = dados.itens.map((item) => item.id);
  const quantidadeSelecionada = chavesPagina.filter((id) => selecionadas.includes(id)).length;
  const selecionarPagina = (marcar: boolean) =>
    setSelecionadas((anteriores) =>
      marcar
        ? [...new Set([...anteriores, ...chavesPagina])]
        : anteriores.filter((id) => !chavesPagina.includes(id))
    );
  const colunas: ColumnsType<TipoFeriadoResumo> = [
    {
      title: "Nome do Feriado",
      dataIndex: "nome",
      align: "center",
      width: "60%",
      render: (nome: string) =>
        podeAlterar ? (
          <button
            type="button"
            className="tipo-feriado-nome"
            onClick={(evento) => {
              evento.stopPropagation();
              avisarDemonstracao();
            }}
          >
            {nome}
          </button>
        ) : (
          nome
        ),
    },
    { title: "Abrangência", dataIndex: "descricaoAbrangencia", align: "center", width: "26%" },
    { title: "Tipo", dataIndex: "descricaoTipo", align: "center" },
  ];

  return (
    <div className="calendario-tipo-feriado">
      <Cabecalho pagina="Lista de tipo de feriado">
        <BotaoVoltar onClick={() => navigate(URL_HOME)} />
        <BotaoExcluir
          disabled={!podeConsultar || !permissoes?.podeExcluir || !selecionadas.length}
          onClick={avisarDemonstracao}
        />
        <Botao
          id="SGP_BUTTON_NOVO"
          label="Novo"
          disabled={!podeConsultar || !permissoes?.podeIncluir}
          onClick={avisarDemonstracao}
        />
      </Cabecalho>
      <section className="calendario-card" aria-label="Tipos de feriado" aria-busy={carregando}>
        <div className="tipo-feriado-filtros">
          <div>
            <label className="campo-label" htmlFor="select-abrangencia">
              Abrangência
            </label>
            <div className="tipo-feriado-select">
              <Select<AbrangenciaFeriado>
                ref={abrangenciaRef}
                id="select-abrangencia"
                placeholder="SELECIONE UMA ABRANGÊNCIA"
                options={[...ABRANGENCIAS_FERIADO]}
                value={consulta.abrangencia || undefined}
                disabled={!podeConsultar}
                virtual={false}
                showSearch
                optionFilterProp="label"
                onChange={(abrangencia) => filtrar({ abrangencia })}
              />
              {!!consulta.abrangencia && (
                <button
                  type="button"
                  className="tipo-feriado-limpar"
                  aria-label="Limpar abrangência"
                  disabled={!podeConsultar}
                  onClick={() => {
                    filtrar({ abrangencia: 0 });
                    abrangenciaRef.current?.focus();
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="campo-label" htmlFor="select-tipo-feriado">
              Tipo
            </label>
            <div className="tipo-feriado-select">
              <Select<TipoFeriado>
                ref={tipoRef}
                id="select-tipo-feriado"
                placeholder="SELECIONE UM TIPO"
                options={[...TIPOS_FERIADO]}
                value={consulta.tipo || undefined}
                disabled={!podeConsultar}
                virtual={false}
                showSearch
                optionFilterProp="label"
                onChange={(tipo) => filtrar({ tipo })}
              />
              {!!consulta.tipo && (
                <button
                  type="button"
                  className="tipo-feriado-limpar"
                  aria-label="Limpar tipo"
                  disabled={!podeConsultar}
                  onClick={() => {
                    filtrar({ tipo: 0 });
                    tipoRef.current?.focus();
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="campo-label" htmlFor="nome-tipo-feriado">
              Nome do tipo de feriado
            </label>
            <Input
              id="nome-tipo-feriado"
              placeholder="DIGITE O NOME DO TIPO DE FERIADO"
              value={consulta.nome}
              disabled={!podeConsultar}
              onChange={(evento) => filtrar({ nome: evento.target.value })}
            />
          </div>
        </div>
        {!podeConsultar && (
          <p role="status">Você não tem permissão para consultar tipos de feriado.</p>
        )}
        <div className="tipo-feriado-tabela">
          <Table<TipoFeriadoResumo>
            id="lista-tipo-feriado"
            rowKey="id"
            bordered
            size="middle"
            loading={carregando}
            columns={colunas}
            dataSource={dados.itens}
            locale={{
              emptyText: falhou ? (
                <span role="alert">
                  Não foi possível carregar os tipos de feriado. Altere um filtro para tentar
                  novamente.
                </span>
              ) : (
                "Sem dados"
              ),
            }}
            rowSelection={{
              selectedRowKeys: podeConsultar ? selecionadas : [],
              preserveSelectedRowKeys: true,
              onChange: (chaves) => setSelecionadas(chaves.map(Number)),
              getCheckboxProps: (item) => ({
                "aria-label": `Selecionar ${item.nome}`,
                disabled: !podeConsultar,
              }),
              columnWidth: 55,
              columnTitle: (
                <Checkbox
                  aria-label="Selecionar todos desta página"
                  disabled={!podeConsultar || !chavesPagina.length}
                  checked={!!chavesPagina.length && quantidadeSelecionada === chavesPagina.length}
                  indeterminate={
                    quantidadeSelecionada > 0 && quantidadeSelecionada < chavesPagina.length
                  }
                  onChange={(evento) => selecionarPagina(evento.target.checked)}
                />
              ),
            }}
            onRow={() => ({
              onClick: (evento) => {
                if ((evento.target as HTMLElement).closest(".ant-table-selection-column")) return;
                if (podeAlterar) avisarDemonstracao();
              },
            })}
            pagination={{
              current: consulta.pagina,
              pageSize: consulta.tamanhoPagina,
              total: dados.total,
              showSizeChanger: false,
              position: ["bottomCenter"],
              hideOnSinglePage: false,
              onChange: (pagina) => setConsulta((anterior) => ({ ...anterior, pagina })),
            }}
          />
        </div>
      </section>
    </div>
  );
};

export default TipoFeriadoLista;
