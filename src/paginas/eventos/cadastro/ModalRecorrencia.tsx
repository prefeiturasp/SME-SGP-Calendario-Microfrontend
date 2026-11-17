import { faChevronDown, faRetweet } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, DatePicker, Dropdown, InputNumber, Modal, Row } from "antd";
import type { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { Botao } from "../../../componentes/ui/Botao";
import { SelectCampo } from "../../../componentes/ui/SelectCampo";
import { dayjs, paraDia, type ValorData } from "../../../core/datas";
import {
  DIAS_SEMANA,
  PADROES_MENSAIS,
  TIPO_RECORRENCIA_MES,
  TIPO_RECORRENCIA_SEMANA,
  recorrenciaValida,
  textoDiasSemana,
  type RecorrenciaTela,
} from "../../../core/regras/eventoRecorrencia";
import { useEventosCadastro } from "./EventosCadastroContext";

const estadoInicial = (dataInicio: Dayjs | null): RecorrenciaTela => ({
  dataInicio,
  dataTermino: null,
  diasSemana: [],
  diaSemana: null,
  diaNumero: null,
  padraoRecorrencia: null,
  quantidadeRecorrencia: 1,
  tipoRecorrencia: TIPO_RECORRENCIA_MES,
});

// Recorrência só dentro do ano corrente, como na tela antiga.
const foraDoAno = (data: Dayjs) =>
  data.isBefore(dayjs().startOf("year")) || data.isAfter(dayjs().endOf("year"));

const LinkDropdown = ({
  texto,
  itens,
}: {
  texto: string;
  itens: { key: string; label: string; onClick: () => void }[];
}) => (
  <Dropdown trigger={["click"]} menu={{ items: itens }}>
    <a href="#recorrencia" className="recorrencia-dropdown" onClick={(e) => e.preventDefault()}>
      <span>{texto}</span> <FontAwesomeIcon icon={faChevronDown} className="" />
    </a>
  </Dropdown>
);

const ModalRecorrencia = ({
  show,
  dataInicioEvento,
  onClose,
  onSave,
}: {
  show: boolean;
  dataInicioEvento: ValorData;
  onClose: () => void;
  onSave: (recorrencia: RecorrenciaTela | null) => void;
}) => {
  const { pedidoLimparRecorrencia } = useEventosCadastro();
  const inicioDoEvento = paraDia(dataInicioEvento);
  const [estado, setEstado] = useState<RecorrenciaTela>(estadoInicial(inicioDoEvento));
  const [tentouSalvar, setTentouSalvar] = useState(false);

  // A data de início acompanha a do evento.
  useEffect(() => {
    setEstado((atual) => ({ ...atual, dataInicio: inicioDoEvento }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicioDoEvento?.valueOf()]);

  const descartar = () => {
    setEstado(estadoInicial(inicioDoEvento));
    setTentouSalvar(false);
    onSave(null);
    onClose();
  };

  useEffect(() => {
    if (pedidoLimparRecorrencia > 0) descartar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoLimparRecorrencia]);

  const inicioMaiorQueFim =
    !!estado.dataInicio &&
    !!estado.dataTermino &&
    estado.dataInicio.isAfter(estado.dataTermino, "day");

  const salvar = () => {
    setTentouSalvar(true);
    if (inicioMaiorQueFim || !recorrenciaValida(estado)) return;
    onSave(estado);
  };

  const alternarDia = (dia: (typeof DIAS_SEMANA)[number]) =>
    setEstado((atual) => ({
      ...atual,
      diasSemana: atual.diasSemana.some((d) => d.valor === dia.valor)
        ? atual.diasSemana.filter((d) => d.valor !== dia.valor)
        : [...atual.diasSemana, dia],
    }));

  const mensal = estado.tipoRecorrencia.value === TIPO_RECORRENCIA_MES.value;

  return (
    <Modal
      open={show}
      title="Repetir"
      closable
      maskClosable={false}
      onCancel={descartar}
      destroyOnClose={false}
      footer={
        <div className="recorrencia-rodape">
          <Botao id="btn-recorrencia-descartar" label="Descartar" cor="azul" onClick={descartar} />
          <Botao
            id="btn-recorrencia-salvar"
            label="Salvar"
            disabled={!recorrenciaValida(estado)}
            onClick={salvar}
          />
        </div>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <label className="campo-label" htmlFor="recorrencia-inicio">
            Data início
          </label>
          <DatePicker
            id="recorrencia-inicio"
            format="DD/MM/YYYY"
            placeholder="DD/MM/AAAA"
            style={{ width: "100%" }}
            value={estado.dataInicio}
            disabledDate={foraDoAno}
            onChange={(data) => setEstado((atual) => ({ ...atual, dataInicio: data }))}
          />
          {tentouSalvar && !estado.dataInicio && <div className="campo-erro">Data obrigatória</div>}
          {inicioMaiorQueFim && <div className="campo-erro">Data inicial maior que final</div>}
        </Col>
        <Col xs={24} lg={12}>
          <label className="campo-label" htmlFor="recorrencia-fim">
            Data fim
          </label>
          <DatePicker
            id="recorrencia-fim"
            format="DD/MM/YYYY"
            placeholder="DD/MM/AAAA"
            style={{ width: "100%" }}
            value={estado.dataTermino}
            disabledDate={foraDoAno}
            onChange={(data) => setEstado((atual) => ({ ...atual, dataTermino: data }))}
          />
        </Col>

        <Col span={24} className="recorrencia-linha">
          <span className="recorrencia-item">
            <FontAwesomeIcon icon={faRetweet} className="" /> Repetir a cada
          </span>
          <span className="recorrencia-item">
            <LinkDropdown
              texto={String(estado.quantidadeRecorrencia)}
              itens={[1, 2, 3, 4].map((n) => ({
                key: String(n),
                label: String(n),
                onClick: () => setEstado((atual) => ({ ...atual, quantidadeRecorrencia: n })),
              }))}
            />
          </span>
          <span className="recorrencia-item">
            <LinkDropdown
              texto={estado.tipoRecorrencia.label}
              itens={[TIPO_RECORRENCIA_SEMANA, TIPO_RECORRENCIA_MES].map((tipo) => ({
                key: tipo.value,
                label: tipo.label,
                onClick: () =>
                  setEstado((atual) => ({
                    ...atual,
                    tipoRecorrencia: tipo,
                    diasSemana: [],
                    padraoRecorrencia: null,
                    diaSemana: null,
                    diaNumero: null,
                  })),
              }))}
            />
          </span>
        </Col>

        {mensal ? (
          <>
            <Col span={24}>
              <strong>Padrão de recorrência</strong>
            </Col>
            <Col xs={24} lg={12}>
              <SelectCampo
                id="recorrencia-padrao"
                lista={PADROES_MENSAIS}
                valueOption="valor"
                valueText="desc"
                value={estado.padraoRecorrencia || undefined}
                placeholder="Selecione a recorrência"
                onChange={(valor) =>
                  setEstado((atual) => ({
                    ...atual,
                    padraoRecorrencia: String(valor),
                    diaNumero: null,
                  }))
                }
              />
            </Col>
            <Col xs={24} lg={12}>
              {estado.padraoRecorrencia === "0" ? (
                <InputNumber
                  id="recorrencia-dia-numero"
                  min={1}
                  max={31}
                  style={{ width: "100%" }}
                  value={estado.diaNumero ?? null}
                  onChange={(valor) =>
                    setEstado((atual) => ({ ...atual, diaNumero: valor ?? null }))
                  }
                />
              ) : (
                <SelectCampo
                  id="recorrencia-dia-semana"
                  lista={DIAS_SEMANA.map((d) => ({ valor: d.valor, desc: d.descricao }))}
                  valueOption="valor"
                  valueText="desc"
                  value={estado.diaSemana || undefined}
                  placeholder="Selecione o dia"
                  onChange={(valor) =>
                    setEstado((atual) => ({ ...atual, diaSemana: String(valor) }))
                  }
                />
              )}
            </Col>
          </>
        ) : (
          <Col span={24}>
            {DIAS_SEMANA.map((dia) => (
              <button
                type="button"
                key={dia.valor}
                aria-label={dia.descricao}
                aria-pressed={estado.diasSemana.some((d) => d.valor === dia.valor)}
                className={`dia-circulo${
                  estado.diasSemana.some((d) => d.valor === dia.valor) ? " ativo" : ""
                }`}
                onClick={() => alternarDia(dia)}
              >
                {dia.legenda}
              </button>
            ))}
          </Col>
        )}

        {!mensal && estado.diasSemana.length > 0 && (
          <Col span={24}>{textoDiasSemana(estado.diasSemana)}</Col>
        )}
        {!estado.dataTermino && (
          <Col span={24}>
            <small className="recorrencia-info">
              Se não selecionar uma data fim, será considerado o fim do ano letivo.
            </small>
          </Col>
        )}
      </Row>
    </Modal>
  );
};

export default ModalRecorrencia;
