import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { exibirErrosApi } from "../../core/config/alertas";
import { fechamentoReaberturaService } from "../../services/fechamentoReaberturaService";

export const ListaPaginada = ({
  filtro,
  filtroEhValido,
  colunas,
  onClick,
  onSelecionar,
}: {
  filtro: Record<string, unknown>;
  filtroEhValido: boolean;
  colunas: ColumnsType<Record<string, unknown>>;
  onClick: (item: Record<string, unknown>) => void;
  onSelecionar: (itens: Record<string, unknown>[]) => void;
}) => {
  const [carregando, setCarregando] = useState(false);
  const [linhas, setLinhas] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [tamanho, setTamanho] = useState(10);
  const [selecionadas, setSelecionadas] = useState<Array<string | number>>([]);
  const filtroSerializado = JSON.stringify(filtro);

  useEffect(() => {
    setPagina(1);
    setSelecionadas([]);
  }, [filtroSerializado]);

  useEffect(() => {
    if (!filtroEhValido) {
      setLinhas([]);
      setTotal(0);
      return;
    }

    let ativo = true;
    setCarregando(true);
    setSelecionadas([]);
    onSelecionar([]);
    fechamentoReaberturaService
      .listar(pagina, tamanho, filtro)
      .then((resposta) => {
        if (!ativo) return;
        const items = (resposta.data?.items || []) as unknown as Record<string, unknown>[];
        setLinhas(items);
        setTotal(resposta.data?.totalRegistros || 0);
      })
      .catch((falha) => {
        if (ativo) exibirErrosApi(falha);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [filtroEhValido, filtroSerializado, pagina, tamanho]);

  return (
    <Table
      id="lista-fechamento-reaberturas"
      rowKey="id"
      bordered
      size="middle"
      loading={carregando}
      columns={colunas}
      dataSource={linhas}
      locale={{ emptyText: "Sem dados" }}
      rowSelection={{
        selectedRowKeys: selecionadas,
        onChange: (chaves, registros) => {
          setSelecionadas(chaves as Array<string | number>);
          onSelecionar(registros);
        },
      }}
      onRow={(registro) => ({
        onClick: (evento) => {
          const alvo = evento.target as HTMLElement;
          if (alvo.closest(".ant-table-selection-column")) return;
          onClick(registro);
        },
      })}
      pagination={{
        current: pagina,
        pageSize: tamanho,
        total,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50", "100"],
        locale: { items_per_page: "" },
        onChange: (novaPagina, novoTamanho) => {
          setPagina(novoTamanho !== tamanho ? 1 : novaPagina);
          setTamanho(novoTamanho);
        },
      }}
    />
  );
};
