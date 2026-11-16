import { Checkbox, Col, Row, Switch } from "antd";
import type { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { CampoBusca } from "../../../componentes/ui/CampoBusca";
import { CampoDataFiltro } from "../../../componentes/ui/CampoDataFiltro";
import { Loader } from "../../../componentes/ui/Loader";
import { SelectAutocomplete } from "../../../componentes/ui/SelectAutocomplete";
import { SelectCampo } from "../../../componentes/ui/SelectCampo";
import { exibirErrosApi } from "../../../core/config/alertas";
import {
  LocalOcorrencia,
  OPCAO_TODOS,
  comoLista,
  type LocalOcorrenciaValor,
  type TipoCalendario,
} from "../../../core/constantes";
import { ordenarPorNome, type Abrangencia } from "../../../core/regras/reabertura";
import type { TipoEvento } from "../../../mocks/CalendarioEscolar/Eventos/lista";
import { eventoService } from "../../../services/eventoService";
import type { RootState } from "../../../types/redux";
import { useEventosLista } from "./EventosListaContext";

const ESPERA_BUSCA_NOME_MS = 800;

// Tipos de evento disponíveis conforme o recorte escolhido (SME / DRE / UE).
const locaisPorRecorte = (dre?: string, ue?: string): LocalOcorrenciaValor[] => {
  const todasDres = dre === OPCAO_TODOS;
  const todasUes = ue === OPCAO_TODOS;
  if (todasDres && todasUes) {
    return [LocalOcorrencia.SME, LocalOcorrencia.SMEUE, LocalOcorrencia.TODOS];
  }
  if (!todasDres && todasUes) return [LocalOcorrencia.DRE, LocalOcorrencia.TODOS];
  if (!todasDres && !todasUes) {
    return [LocalOcorrencia.UE, LocalOcorrencia.SMEUE, LocalOcorrencia.TODOS];
  }
  return [];
};

const datasValidas = (inicio: Dayjs | null, fim: Dayjs | null) =>
  (!inicio && !fim) || (!!inicio && !!fim && !fim.isBefore(inicio, "day"));

const EventosListaFiltros = () => {
  const usuario = useSelector((state: RootState) => state.usuario);
  const {
    consideraHistorico,
    setConsideraHistorico,
    codigoDre,
    setCodigoDre,
    codigoUe,
    setCodigoUe,
    calendarioSelecionado,
    setCalendarioSelecionado,
    tipoEventoSelecionado,
    setTipoEventoSelecionado,
    nomeEvento,
    setNomeEvento,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    ehEventosTodaRede,
    setEhEventosTodaRede,
    setFiltrarNovaConsulta,
  } = useEventosLista();

  const [calendarios, setCalendarios] = useState<TipoCalendario[]>([]);
  const [dres, setDres] = useState<Abrangencia[]>([]);
  const [ues, setUes] = useState<Abrangencia[]>([]);
  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
  const [carregandoCalendarios, setCarregandoCalendarios] = useState(false);
  const [carregandoDres, setCarregandoDres] = useState(false);
  const [carregandoUes, setCarregandoUes] = useState(false);
  const esperaNome = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(esperaNome.current), []);

  const buscarCalendarios = useCallback(
    async (descricao: string) => {
      setCarregandoCalendarios(true);
      try {
        const resposta = await eventoService.obterTiposCalendario(descricao);
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
    let ativo = true;
    eventoService
      .obterTiposEvento()
      .then((resposta) => {
        if (ativo) setTiposEvento(comoLista<TipoEvento>(resposta.data?.items));
      })
      .catch((falha) => {
        if (!ativo) return;
        exibirErrosApi(falha, usuario.logado);
        setTiposEvento([]);
      });
    return () => {
      ativo = false;
    };
  }, [usuario.logado]);

  // Sem calendário válido, os demais filtros voltam ao estado inicial.
  useEffect(() => {
    if (calendarioSelecionado?.id) return;
    setNomeEvento("");
    setTipoEventoSelecionado("");
    setDataInicio(null);
    setDataFim(null);
  }, [calendarioSelecionado?.id, setNomeEvento, setTipoEventoSelecionado, setDataInicio, setDataFim]);

  useEffect(() => {
    if (!calendarioSelecionado?.id) {
      setCodigoDre(undefined);
      setDres([]);
      return;
    }
    let ativo = true;
    setCarregandoDres(true);
    eventoService
      .buscarDres(consideraHistorico)
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
        if (!ativo) return;
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
  }, [calendarioSelecionado?.id, consideraHistorico, usuario.possuiPerfilSme, usuario.logado, setCodigoDre]);

  useEffect(() => {
    if (!codigoDre || !calendarioSelecionado?.id) {
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
    setCarregandoUes(true);
    eventoService
      .buscarUes(codigoDre, consideraHistorico)
      .then((resposta) => {
        if (!ativo) return;
        const lista = comoLista<Abrangencia>(resposta.data).sort(ordenarPorNome("nome"));
        if (lista.length === 1) setCodigoUe(lista[0].codigo);
        if (usuario.possuiPerfilSmeOuDre && lista.length > 1) {
          lista.unshift({ codigo: OPCAO_TODOS, nome: "Todas" });
          setCodigoUe(OPCAO_TODOS);
        }
        setUes(lista);
      })
      .catch((falha) => {
        if (!ativo) return;
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
  }, [
    codigoDre,
    calendarioSelecionado?.id,
    consideraHistorico,
    usuario.possuiPerfilSmeOuDre,
    usuario.logado,
    setCodigoUe,
  ]);

  const tiposEventoFiltrados = useMemo(() => {
    if (!codigoDre && !codigoUe) return [];
    const locais = locaisPorRecorte(codigoDre, codigoUe);
    return tiposEvento.filter((tipo) => locais.includes(tipo.localOcorrencia));
  }, [tiposEvento, codigoDre, codigoUe]);

  // Troca de recorte pode tirar da lista o tipo já escolhido.
  useEffect(() => {
    if (!tipoEventoSelecionado) return;
    if (tiposEventoFiltrados.some((tipo) => String(tipo.id) === tipoEventoSelecionado)) return;
    setTipoEventoSelecionado("");
  }, [tiposEventoFiltrados, tipoEventoSelecionado, setTipoEventoSelecionado]);

  const alterarNome = (valor: string) => {
    setNomeEvento(valor);
    clearTimeout(esperaNome.current);
    if (valor) {
      esperaNome.current = setTimeout(() => setFiltrarNovaConsulta(true), ESPERA_BUSCA_NOME_MS);
    } else {
      setFiltrarNovaConsulta(true);
    }
  };

  const alterarTipoEvento = (valor: string) => {
    setTipoEventoSelecionado(valor);
    setFiltrarNovaConsulta(true);
  };

  const alterarDataInicio = (data: Dayjs | null) => {
    setDataInicio(data);
    if (datasValidas(data, dataFim)) setFiltrarNovaConsulta(true);
  };

  const alterarDataFim = (data: Dayjs | null) => {
    setDataFim(data);
    if (datasValidas(dataInicio, data)) setFiltrarNovaConsulta(true);
  };

  const erroDataInicio = !dataInicio && dataFim ? "Data obrigatória" : "";
  const erroDataFim = (() => {
    if (dataInicio && !dataFim) return "Data obrigatória";
    if (dataInicio && dataFim && dataInicio.isAfter(dataFim, "day")) {
      return "Data inicial maior que final";
    }
    return "";
  })();

  const semCalendario = !calendarioSelecionado?.id;
  const exibirSwitchRede =
    !!usuario.possuiPerfilSme && codigoDre === OPCAO_TODOS && codigoUe === OPCAO_TODOS;

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Checkbox
          id="SGP_CHECKBOX_EXIBIR_HISTORICO"
          checked={consideraHistorico}
          onChange={(evento) => {
            setCodigoDre(undefined);
            setCodigoUe(undefined);
            setUes([]);
            setConsideraHistorico(evento.target.checked);
          }}
        >
          Exibir histórico?
        </Checkbox>
      </Col>

      <Col span={24}>
        <div style={{ maxWidth: 420 }}>
        <Loader loading={carregandoCalendarios}>
          <SelectAutocomplete
            id="SGP_SELECT_TIPO_CALENDARIO"
            label="Calendário"
            placeholder="Selecione o calendário"
            lista={calendarios}
            value={calendarioSelecionado?.descricao || ""}
            onSelect={(texto) => {
              const encontrado = calendarios.find((item) => item.descricao === texto);
              setCalendarioSelecionado(encontrado ?? null);
              setUes([]);
              setCodigoUe(undefined);
            }}
            onChange={(texto) => {
              const encontrado = calendarios.find((item) => item.descricao === texto);
              setCalendarioSelecionado(encontrado ?? ({ descricao: texto } as TipoCalendario));
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
            id="SGP_SELECT_DRE"
            label="Diretoria Regional de Educação (DRE)"
            lista={dres}
            valueOption="codigo"
            valueText="nome"
            disabled={semCalendario || dres.length === 1}
            value={codigoDre}
            placeholder="Selecione uma DRE"
            showSearch
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
            id="SGP_SELECT_UE"
            label="Unidade Escolar (UE)"
            lista={ues}
            valueOption="codigo"
            valueText="nome"
            disabled={!codigoDre || ues.length === 1}
            value={codigoUe}
            placeholder="Selecione uma UE"
            showSearch
            onChange={(valor) => setCodigoUe(String(valor))}
          />
        </Loader>
      </Col>

      <Col xs={24} md={12} xl={8}>
        <CampoBusca
          id="SGP_INPUT_TEXT_NOME_EVENTO"
          label="Nome do evento"
          placeholder="Pesquise o evento pelo nome"
          value={nomeEvento}
          desabilitado={semCalendario}
          onChange={alterarNome}
        />
      </Col>
      <Col xs={24} md={12} xl={8}>
        <SelectCampo
          id="SGP_SELECT_TIPO_EVENTO"
          label="Tipo de evento"
          lista={tiposEventoFiltrados as unknown as Record<string, unknown>[]}
          valueOption="id"
          valueText="descricao"
          value={tipoEventoSelecionado || undefined}
          placeholder="Selecione o tipo de evento"
          disabled={semCalendario}
          permiteLimpar
          onChange={(valor) => alterarTipoEvento(String(valor))}
        />
      </Col>
      <Col xs={12} md={6} xl={4}>
        <CampoDataFiltro
          id="SGP_DATE_SELECIONAR_DATA_INICIO"
          label="Data início"
          placeholder="Data início"
          valor={dataInicio}
          desabilitado={semCalendario}
          erro={erroDataInicio}
          onChange={alterarDataInicio}
        />
      </Col>
      <Col xs={12} md={6} xl={4}>
        <CampoDataFiltro
          id="SGP_DATE_SELECIONAR_DATA_FIM"
          label="Data fim"
          placeholder="Data fim"
          valor={dataFim}
          desabilitado={semCalendario}
          erro={erroDataFim}
          onChange={alterarDataFim}
        />
      </Col>

      {exibirSwitchRede && (
        <Col span={24}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <Switch
              id="SGP_SWITCH_EXIBIR_EVENTO_VALIDO"
              checked={ehEventosTodaRede}
              onChange={(marcado) => {
                setEhEventosTodaRede(marcado);
                setFiltrarNovaConsulta(true);
              }}
            />
            Exibir somente eventos válidos para toda a rede
          </label>
        </Col>
      )}
    </Row>
  );
};

export default EventosListaFiltros;
