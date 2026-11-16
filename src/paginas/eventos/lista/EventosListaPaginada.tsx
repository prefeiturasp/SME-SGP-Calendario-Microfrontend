import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { ListaPaginada, type BuscarLista } from "../../../componentes/ui/ListaPaginada";
import { OPCAO_TODOS, ROTAS, StatusEvento } from "../../../core/constantes";
import { formatarDia } from "../../../core/datas";
import { useDestino } from "../../../core/endereco";
import type { FiltroEventos } from "../../../mocks/CalendarioEscolar/Eventos/lista";
import { eventoService } from "../../../services/eventoService";
import { useEventosLista } from "./EventosListaContext";

const buscar: BuscarLista = (pagina, tamanho, filtro) =>
  eventoService.listar(pagina, tamanho, filtro as FiltroEventos);

const colunas: ColumnsType<Record<string, unknown>> = [
  {
    title: "Nome do evento",
    dataIndex: "nome",
    render: (nome: string, linha) => {
      const aguardando = linha.status === StatusEvento.AguardandoAprovacao;
      return (
        <>
          <div>{`${nome} ${aguardando ? "(Aguardando aprovação)" : ""}`.trim()}</div>
          {linha.descricaoDreUe ? <div>{String(linha.descricaoDreUe)}</div> : null}
        </>
      );
    },
  },
  {
    title: "Tipo de evento",
    dataIndex: "tipoEvento",
    render: (tipo: { descricao: string }) => tipo?.descricao,
  },
  {
    title: "Cadastrado por",
    dataIndex: "criadoPor",
    render: (criadoPor: string, linha) => `${criadoPor} (${String(linha.criadoRF)})`,
  },
  {
    title: "Data do cadastro",
    dataIndex: "criadoEm",
    render: (data: string) => formatarDia(data),
  },
  {
    title: "Data início e fim",
    dataIndex: "dataInicio",
    render: (inicio: string, linha) =>
      `${formatarDia(inicio)} - ${formatarDia(linha.dataFim as string)}`,
  },
];

const EventosListaPaginada = () => {
  const navigate = useDestino();
  const {
    codigoDre,
    codigoUe,
    calendarioSelecionado,
    tipoEventoSelecionado,
    nomeEvento,
    dataInicio,
    dataFim,
    ehEventosTodaRede,
    filtrarNovaConsulta,
    setFiltrarNovaConsulta,
    setEventosSelecionados,
    versaoLista,
  } = useEventosLista();
  const [filtro, setFiltro] = useState<FiltroEventos | null>(null);

  const filtrar = useCallback(() => {
    if (!(calendarioSelecionado?.id && codigoDre && codigoUe)) {
      setFiltro(null);
      return;
    }
    setFiltro({
      tipoCalendarioId: calendarioSelecionado.id,
      dreId: codigoDre === OPCAO_TODOS ? "" : codigoDre,
      ueId: codigoUe === OPCAO_TODOS ? "" : codigoUe,
      ehTodasDres: codigoDre === OPCAO_TODOS,
      ehTodasUes: codigoUe === OPCAO_TODOS,
      tipoEventoId: tipoEventoSelecionado,
      nomeEvento,
      dataInicio: dataInicio ? dataInicio.format("MM-DD-YYYY") : "",
      dataFim: dataFim ? dataFim.format("MM-DD-YYYY") : "",
      ehEventosTodaRede,
    });
  }, [
    calendarioSelecionado,
    codigoDre,
    codigoUe,
    tipoEventoSelecionado,
    nomeEvento,
    dataInicio,
    dataFim,
    ehEventosTodaRede,
  ]);

  // Mudança de abrangência refaz o filtro na hora.
  useEffect(() => {
    filtrar();
  }, [calendarioSelecionado, codigoDre, codigoUe]); // eslint-disable-line react-hooks/exhaustive-deps

  // Demais filtros só consultam quando a tela de filtros sinaliza (datas válidas, debounce do nome).
  useEffect(() => {
    if (!filtrarNovaConsulta) return;
    filtrar();
    setFiltrarNovaConsulta(false);
  }, [filtrarNovaConsulta, filtrar, setFiltrarNovaConsulta]);

  if (!filtro?.tipoCalendarioId) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <ListaPaginada
        id="lista-eventos"
        buscar={buscar}
        recarregar={versaoLista}
        filtro={filtro as Record<string, unknown>}
        filtroEhValido
        colunas={colunas}
        onSelecionar={setEventosSelecionados}
        onClick={(evento) =>
          navigate(`${ROTAS.EVENTOS}/editar/${String(evento.id)}/${calendarioSelecionado?.id}`)
        }
      />
    </div>
  );
};

export default EventosListaPaginada;
