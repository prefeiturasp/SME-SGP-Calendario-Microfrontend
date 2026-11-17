import type { Dayjs } from "dayjs";

export type RecorrenciaTela = {
  dataInicio: Dayjs | null;
  dataTermino: Dayjs | null;
  diasSemana: { valor: string; descricao: string }[];
  diaSemana?: string | null;
  diaNumero?: number | null;
  padraoRecorrencia?: string | null;
  quantidadeRecorrencia: number;
  tipoRecorrencia: { label: string; value: string };
};

export type RecorrenciaPayload = {
  dataInicio: Dayjs | null;
  dataFim: Dayjs | null;
  diaDeOcorrencia?: number | null;
  diasDaSemana: string[];
  padrao: string;
  padraoRecorrenciaMensal?: string | null;
  repeteACada: number;
};

/** Converte o estado do modal "Repetir" no objeto enviado à API. */
export const paraPayloadRecorrencia = (recorrencia: RecorrenciaTela): RecorrenciaPayload => ({
  dataInicio: recorrencia.dataInicio,
  dataFim: recorrencia.dataTermino,
  diaDeOcorrencia: recorrencia.diaNumero,
  diasDaSemana: recorrencia.diasSemana.length
    ? recorrencia.diasSemana.map((item) => item.valor)
    : recorrencia.diaSemana
      ? [recorrencia.diaSemana]
      : [],
  padrao: recorrencia.tipoRecorrencia.value,
  padraoRecorrenciaMensal: recorrencia.padraoRecorrencia,
  repeteACada: recorrencia.quantidadeRecorrencia,
});

export const DIAS_SEMANA = [
  { legenda: "D", valor: "0", descricao: "Domingo" },
  { legenda: "S", valor: "1", descricao: "Segunda-feira" },
  { legenda: "T", valor: "2", descricao: "Terça-feira" },
  { legenda: "Q", valor: "3", descricao: "Quarta-feira" },
  { legenda: "Q", valor: "4", descricao: "Quinta-feira" },
  { legenda: "S", valor: "5", descricao: "Sexta-feira" },
  { legenda: "S", valor: "6", descricao: "Sábado" },
];

export const PADROES_MENSAIS = [
  { valor: "0", desc: "No dia" },
  { valor: "1", desc: "Primeiro" },
  { valor: "2", desc: "Segundo" },
  { valor: "3", desc: "Terceiro" },
  { valor: "4", desc: "Quarto" },
  { valor: "5", desc: "Último" },
];

export const TIPO_RECORRENCIA_SEMANA = { label: "Semana(s)", value: "1" };
export const TIPO_RECORRENCIA_MES = { label: "Mês(es)", value: "2" };

/** O botão "Salvar" do modal só habilita com um padrão completo. */
export const recorrenciaValida = (r: RecorrenciaTela) => {
  if (!r.dataInicio) return false;
  if (r.tipoRecorrencia.value === TIPO_RECORRENCIA_MES.value) {
    const noDia = r.padraoRecorrencia === "0" && !!r.diaNumero && r.diaNumero > 0;
    const naSemana = !!r.padraoRecorrencia && r.padraoRecorrencia !== "0" && !!r.diaSemana;
    return noDia || naSemana;
  }
  return r.diasSemana.length > 0;
};

/** Texto "Ocorre a cada Segunda-feira e Quarta-feira" exibido abaixo dos dias. */
export const textoDiasSemana = (dias: { descricao: string }[]) => {
  if (!dias.length) return "";
  if (dias.length === 1) return `Ocorre a cada ${dias[0].descricao}`;
  const ultimo = dias[dias.length - 1].descricao;
  const anteriores = dias.slice(0, -1).map((d) => d.descricao);
  return `Ocorre a cada ${anteriores.join(", ")} e ${ultimo}`;
};
