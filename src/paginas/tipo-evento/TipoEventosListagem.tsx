import { ROTAS } from '~/core/constantes'
import { Col, Row } from 'antd';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Cabecalho } from '~/componentes/ui/Cabecalho';
import BotaoExcluirPadrao from '~/componentes/ui/BotaoExcluirPadrao';
import { Botao, BotaoVoltar } from '~/componentes/ui/Botao';
import { ListaPaginada } from '~/componentes/tipo-eventos/ListaPaginada';
import { SelectCampo } from '~/componentes/ui/SelectCampo';
import { confirmar, sucesso } from '~/core/config/alertas';
import { verificaSomenteConsulta } from '~/core/sessao';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '~/types/redux';

type TTipoEventoSelecionado = {
  id: number;
  descricao: string;
};

export const TipoEventosListagem = () => {
  const usuario = useSelector((state: RootState) => state.usuario);
  const navigate = useNavigate();
  const permissoesTela = usuario.permissoes?.[ROTAS.TIPO_EVENTOS];

  const [tipoEventoSelecionados, setTipoEventoSelecionados] = useState<TTipoEventoSelecionado[]>([]);
  const [idsMockadosDeletados, setIdsMockadosDeletados] = useState<number[]>([]);
  const [filtro, setFiltro] = useState({});

  const clicouBotaoVoltar = () => {
    navigate('/');
  };

  const clicouBotaoExcluir = async () => {
    if (tipoEventoSelecionados && tipoEventoSelecionados.length > 0) {
      const listaNomesExcluir = tipoEventoSelecionados.map(
        tipo => tipo.descricao
      );

      const textoListaNomesExcluir = listaNomesExcluir.join(', ');

      const confirmado = await confirmar(
        'Atenção',
        textoListaNomesExcluir,
        'Você tem certeza que deseja excluir estes itens?',
        'Excluir',
        'Cancelar',
        (
          <>
            <ul>
              {listaNomesExcluir.map((nome, index) => (
                <li key={`${index}-${nome}`}>{nome}</li>
              ))}
            </ul>

            <b>Você tem certeza que deseja excluir estes itens?</b>
          </>
        )
      );

      if (confirmado) {
        const idsDeletar = tipoEventoSelecionados.map(tipo => tipo.id);

        setIdsMockadosDeletados(prevIds => [...prevIds, ...idsDeletar]);

        sucesso('Tipos de evento deletados com sucesso!');
      }
    }
  };

  useEffect(() => {
    verificaSomenteConsulta(permissoesTela);
  }, []);

  const clicouBotaoNovo = () => {
    if (permissoesTela?.podeIncluir)
      navigate(`${ROTAS.TIPO_EVENTOS}/novo`);
  };

  const clicouBotaoEditar = (tipoEvento: { id: number; }) => {
    if (permissoesTela?.podeAlterar)
      navigate(`${ROTAS.TIPO_EVENTOS}/editar/${tipoEvento.id}`);
  };

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

  const colunas = [
    {
      title: 'Tipo de Evento',
      dataIndex: 'descricao',
      className: 'text-left px-4',
    },
    {
      title: 'Local de ocorrência',
      dataIndex: 'localOcorrencia',
      className: 'text-left px-4',
      render: (localOcorrencia: number) =>
        listaLocalOcorrencia?.filter?.(l => l?.valor === localOcorrencia)[0]
          ?.descricao,
    },
    {
      title: 'Letivo',
      dataIndex: 'letivo',
      className: 'text-left px-4',
      render: (letivo: number) =>
        listaLetivo?.filter?.(l => l.valor === letivo)[0]?.descricao,
    },
  ];

  const [localOcorrenciaSelecionado, setLocalOcorrenciaSelecionado] =
    useState<number | null>(null);

  const aoSelecionarLocalOcorrencia = (local: number) => {
    setLocalOcorrenciaSelecionado(local);
    setFiltro({ ...filtro, localOcorrencia: local });
  };

  const [letivoSelecionado, setLetivoSelecionado] = useState<number | null>(null);

  const aoSelecionarLetivo = (letivo: number) => {
    setLetivoSelecionado(letivo);
    setFiltro({ ...filtro, letivo });
  };

  const [nomeTipoEvento, setNomeTipoEvento] = useState('');

  const aoDigitarNomeTipoEvento = (value: string) => {
    // utiliza debounce para evitar múltiplas chamadas à API enquanto o usuário digita
    const debounce = (func: Function, wait: number) => {
      let timeout: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    };

    const debounced = debounce((value: string) => {
      setNomeTipoEvento(value);
      setFiltro({ ...filtro, descricao: value });
    }, 500);

    debounced(value);
  };

  const aoSelecionarItems = (items: TTipoEventoSelecionado[]) => {
    setTipoEventoSelecionados(items);
  };

  return (
    <>
      <Cabecalho pagina="Tipo de eventos">
        <Row gutter={[8, 8]}>
          <Col>
            <BotaoVoltar onClick={() => clicouBotaoVoltar()} />
          </Col>
          <Col>
            <BotaoExcluirPadrao
              onClick={clicouBotaoExcluir}
              disabled={
                !permissoesTela?.podeExcluir ||
                (tipoEventoSelecionados && tipoEventoSelecionados.length < 1)
              }
            />
          </Col>
          <Col>
            <Botao
              id='SGP_BUTTON_NOVO'
              label="Novo"
              onClick={clicouBotaoNovo}
              disabled={!permissoesTela?.podeIncluir}
            />
          </Col>
        </Row>
      </Cabecalho>
      <section className="calendario-card">
        <div className="row mb-3 w-100 mx-auto">
          <div className="col-4">
            <SelectCampo
              placeholder="Local de ocorrência"
              valueOption="valor"
              valueText="descricao"
              lista={listaLocalOcorrencia}
              onChange={(e) => {
                const numberValue = Number(e);
                aoSelecionarLocalOcorrencia(numberValue);
              }}
              value={localOcorrenciaSelecionado ? String(localOcorrenciaSelecionado) : ''}
              id='select-local-ocorrencia'
              allowClear
            />
          </div>
          <div className="col-3">
            <SelectCampo
              placeholder="Letivo"
              valueOption="valor"
              valueText="descricao"
              lista={listaLetivo}
              onChange={(e) => {
                const numberValue = Number(e);
                aoSelecionarLetivo(numberValue)
              }}
              value={letivoSelecionado ? String(letivoSelecionado) : ''}
              id='select-letivo'
              allowClear
            />
          </div>
          <div className="col-5 position-relative">
            <i className="icone icone-busca fa fa-search fa-lg bg-transparent position-absolute text-center" />
            <input
              className="search-input form-control form-control-lg"
              type="text"
              placeholder="Buscar..."
              onChange={(e) => aoDigitarNomeTipoEvento(e.target.value)}
              value={nomeTipoEvento}
            />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <ListaPaginada
            url="v1/calendarios/eventos/tipos/listar"
            id="lista-tipo-eventos"
            colunaChave="id"
            colunas={colunas}
            filtro={filtro}
            onClick={clicouBotaoEditar}
            multiSelecao
            selecionarItems={aoSelecionarItems}
            filtroEhValido
            idsMockadosDeletados={idsMockadosDeletados}
          />
        </div>
      </section>
    </>
  );
};
