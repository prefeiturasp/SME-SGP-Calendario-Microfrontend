import { useState, useEffect } from 'react';

import { Table } from 'antd';

import { exibirErrosApi } from '~/core/config/alertas';

import type { Key } from 'antd/lib/table/interface';
import { type TItemLinha, mockTipoEventos } from '~/mocks/mockTipoEventos';

import './styles.css';


type TResponseDataLista = {
  items: TItemLinha[]
  totalRegistros: number
  totalPaginas: number
}

type TListaPaginadaProps = {
  colunas: any[];
  multiSelecao?: boolean;
  onClick?: (item: any, colunaClicada: any) => void;
  onSelecionarLinhas?: (ids: Array<string | number>) => void;
  selecionarItems?: (itens: any[]) => void;
  url: string;
  colunaChave: keyof TItemLinha;
  filtro: Record<string, unknown> | null;
  filtroEhValido?: boolean;
  paramArrayFormat?: 'brackets' | 'indices' | 'repeat' | 'comma';
  temPaginacao?: boolean;
  setLista?: (novaLista: any[], listaAtual: any[]) => void;
  showSizeChanger?: boolean;
  naoFiltrarQuandoCarregando?: boolean;
  mapearNovoDto?: (items: any[]) => any[];
  id?: string;
  disabledCheckboxRow?: (item: any) => boolean;
  expandIcon?: any;
  expandedRowKeys?: Array<string | number>;
  expandedRowRender?: (item: any) => React.ReactNode;
  limparDados?: boolean;
  idsMockadosDeletados: number[];
}

export const ListaPaginada = (props: TListaPaginadaProps) => {
  const {
    filtro,
    colunaChave,
    colunas,
    onClick,
    multiSelecao,
    onSelecionarLinhas,
    filtroEhValido = true,
    temPaginacao = true,
    showSizeChanger = true,
    naoFiltrarQuandoCarregando = true,
    id,
    disabledCheckboxRow,
    expandIcon,
    expandedRowKeys,
    expandedRowRender,
    limparDados,
    mapearNovoDto,
    setLista = () => { },
    idsMockadosDeletados = [],
    selecionarItems = () => { },
  } = props;

  const [carregando, setCarregando] = useState(false);
  const [total, setTotal] = useState(0);
  const [linhas, setLinhas] = useState<TItemLinha[]>([]);
  const [linhasSelecionadas, setLinhasSelecionadas] = useState<number[]>([]);

  const paginacaoDefault = {
    defaultPageSize: 10,
    pageSize: 10,
    total: 0,
    showSizeChanger,
    pageSizeOptions: ['10', '20', '50', '100'],
    locale: { items_per_page: 'Linhas' },
    current: 1,
  };


  const [paginaAtual, setPaginaAtual] = useState(paginacaoDefault);

  useEffect(() => {
    if (limparDados) {
      setLinhas([]);
      setCarregando(false);
      setTotal(0);
      setLinhasSelecionadas([]);
      setPaginaAtual({ ...paginacaoDefault });
    }
  }, [limparDados]);

  const selecionaItems = (selecionadas: number[]) => {
    if (selecionarItems && linhas) {
      const items = linhas.filter(
        item => selecionadas?.indexOf(item[colunaChave] as number) >= 0
      );
      selecionarItems(items);
    }
  };

  const selecionar = (ids: number[]) => {
    setLinhasSelecionadas(ids);
    if (onSelecionarLinhas) onSelecionarLinhas(ids);
    selecionaItems(ids);
  };

  const selecaoLinha = {
    selectedRowKeys: linhasSelecionadas,
    onChange: (selectedRowKeys: Key[]) => {
      selecionar(selectedRowKeys as number[]);
    },
    getCheckboxProps: (record: any) => ({
      disabled: disabledCheckboxRow ? disabledCheckboxRow(record) : false,
    }),
  };

  const selecionarLinha = (linha: any) => {
    if (disabledCheckboxRow?.(linha)) return;

    let selecionadas = [...linhasSelecionadas];
    if (selecionadas?.indexOf(linha[colunaChave]) >= 0) {
      selecionadas.splice(selecionadas.indexOf(linha[colunaChave]), 1);
    } else if (multiSelecao) {
      selecionadas.push(linha[colunaChave]);
    } else {
      selecionadas = [];
      selecionadas.push(linha[colunaChave]);
    }
    setLinhasSelecionadas(selecionadas);
    if (onSelecionarLinhas) onSelecionarLinhas(selecionadas);
    selecionaItems(selecionadas);
  };

  const clicarLinha = (row: any, colunaClicada: any) => {
    if (onClick) {
      onClick(row, colunaClicada);
    }
  };

  const filtrar = () => {
    if (naoFiltrarQuandoCarregando && carregando) return;
    let statusCode = 0;
    selecionar([]);
    setCarregando(true);

    new Promise<{ data: TResponseDataLista; status: number }>((resolve) => {
      setTimeout(() => {
        let filteredItems = mockTipoEventos;

        if (idsMockadosDeletados.length > 0) {
          filteredItems = filteredItems.filter(item => !idsMockadosDeletados.includes(item.id));
        }
        if (filtro?.localOcorrencia) {
          filteredItems = filteredItems.filter(item => item.localOcorrencia === filtro?.localOcorrencia);
        }
        if (filtro?.letivo) {
          filteredItems = filteredItems.filter(item => item.letivo === filtro?.letivo);
        }
        if (filtro?.descricao) {
          filteredItems = filteredItems.filter(item => item.descricao.toLowerCase().includes((filtro?.descricao as string).toLowerCase()));
        }

        const totalRegistros = filteredItems.length;
        const totalPaginas = Math.ceil(totalRegistros / paginaAtual.pageSize);
        const startIndex = (paginaAtual.current - 1) * paginaAtual.pageSize;
        const endIndex = startIndex + paginaAtual.pageSize;
        const items = filteredItems.slice(startIndex, endIndex);

        resolve({
          data: {
            items,
            totalRegistros,
            totalPaginas,
          },
          status: 200,
        });
      }, 1000);
    })
      .then((resposta) => {
        const data = resposta.data as TResponseDataLista;
        statusCode = resposta.status;
        setLinhas([]);
        setTotal(data.totalRegistros);
        let items = data?.items ?? [];
        if (items?.length > 0) {
          if (mapearNovoDto) {
            items = mapearNovoDto(items);
          }
          setLinhas([...items]);
          if (setLista) {
            setLista(items, linhas);
          }
        } else {
          setLista([], linhas);
        }
      })
      .catch((e) => {
        if (statusCode !== 204) {
          exibirErrosApi(e);
        }
      })
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    if (!limparDados && filtroEhValido) {
      filtrar();
    }
  }, [limparDados, filtroEhValido, paginaAtual]);

  useEffect(() => {
    const novaPagina = { ...paginaAtual };
    novaPagina.current = 1;
    setPaginaAtual(novaPagina);
  }, [filtro, idsMockadosDeletados]);

  const executaPaginacao = (pagina: typeof paginacaoDefault) => {
    const novaPagina = { ...paginaAtual, ...pagina };
    if (pagina.total < pagina.pageSize) {
      novaPagina.current = 1;
    }
    setPaginaAtual(novaPagina);
  };

  return (
    <div className="table-responsive lista-paginada">
      <Table
        id={id}
        className={multiSelecao ? '' : 'ocultar-coluna-multi-selecao'}
        rowKey={colunaChave}
        rowSelection={selecaoLinha}
        columns={colunas}
        dataSource={linhas}
        onRow={row => ({
          onClick: (e) => {
            const alvo = e.target as HTMLElement;
            const celulaSelecao = alvo.closest('.ant-table-selection-column');
            if (!celulaSelecao) return clicarLinha(row, e);
            if (alvo.closest('.ant-checkbox-wrapper')) return;
            selecionarLinha(row);
          }
        })}
        pagination={
          temPaginacao
            ? {
              defaultPageSize: paginaAtual.defaultPageSize,
              pageSize: paginaAtual.pageSize,
              total,
              showSizeChanger,
              pageSizeOptions: ['10', '20', '50', '100'],
              locale: { items_per_page: '' },
              current: paginaAtual.current,
            }
            : false
        }
        bordered
        size="middle"
        locale={{ emptyText: 'Sem dados' }}
        onHeaderRow={() => {
          return {
            onClick: colunaClicada => {
              if (
                colunaClicada?.currentTarget?.className === 'ant-table-selection-column'
              ) {
                const checkboxSelecionarTodos = document
                  .getElementsByClassName('ant-table-selection')[0]
                  .getElementsByClassName('ant-checkbox-wrapper')[0]
                  .getElementsByClassName('ant-checkbox')[0]
                  .getElementsByClassName('ant-checkbox-input')[0] as HTMLInputElement;

                if (checkboxSelecionarTodos) checkboxSelecionarTodos.click();
              }
            },
          };
        }}
        onChange={(e) => executaPaginacao(e as typeof paginacaoDefault)}
        loading={carregando}
        // expandIconAsCell={false}
        expandable={{
          expandedRowRender,
          expandIcon,
          expandedRowKeys,
          showExpandColumn: false,
        }}
      />
    </div>
  );
};
