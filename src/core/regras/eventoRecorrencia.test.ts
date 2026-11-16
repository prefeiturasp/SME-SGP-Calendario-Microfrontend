import { describe, expect, it } from "vitest";
import { dayjs } from "../datas";
import {
  TIPO_RECORRENCIA_MES,
  TIPO_RECORRENCIA_SEMANA,
  paraPayloadRecorrencia,
  recorrenciaValida,
  textoDiasSemana,
  type RecorrenciaTela,
} from "./eventoRecorrencia";

const base = (parcial: Partial<RecorrenciaTela> = {}): RecorrenciaTela => ({
  dataInicio: dayjs("2025-03-03"),
  dataTermino: null,
  diasSemana: [],
  diaSemana: null,
  diaNumero: null,
  padraoRecorrencia: null,
  quantidadeRecorrencia: 1,
  tipoRecorrencia: TIPO_RECORRENCIA_MES,
  ...parcial,
});

describe("recorrenciaValida", () => {
  it("exige data de início", () => {
    expect(recorrenciaValida(base({ dataInicio: null, padraoRecorrencia: "0", diaNumero: 5 }))).toBe(
      false,
    );
  });

  it("mensal 'no dia' precisa do número do dia", () => {
    expect(recorrenciaValida(base({ padraoRecorrencia: "0" }))).toBe(false);
    expect(recorrenciaValida(base({ padraoRecorrencia: "0", diaNumero: 15 }))).toBe(true);
  });

  it("mensal por posição precisa do dia da semana", () => {
    expect(recorrenciaValida(base({ padraoRecorrencia: "2" }))).toBe(false);
    expect(recorrenciaValida(base({ padraoRecorrencia: "2", diaSemana: "3" }))).toBe(true);
  });

  it("semanal precisa de ao menos um dia", () => {
    const semanal = { tipoRecorrencia: TIPO_RECORRENCIA_SEMANA };
    expect(recorrenciaValida(base(semanal))).toBe(false);
    expect(
      recorrenciaValida(base({ ...semanal, diasSemana: [{ valor: "1", descricao: "Segunda-feira" }] })),
    ).toBe(true);
  });
});

describe("paraPayloadRecorrencia", () => {
  it("usa os dias marcados na recorrência semanal", () => {
    const payload = paraPayloadRecorrencia(
      base({
        tipoRecorrencia: TIPO_RECORRENCIA_SEMANA,
        diasSemana: [
          { valor: "1", descricao: "Segunda-feira" },
          { valor: "3", descricao: "Quarta-feira" },
        ],
        quantidadeRecorrencia: 2,
      }),
    );
    expect(payload.diasDaSemana).toEqual(["1", "3"]);
    expect(payload.padrao).toBe("1");
    expect(payload.repeteACada).toBe(2);
  });

  it("usa o dia da semana único na recorrência mensal", () => {
    const payload = paraPayloadRecorrencia(base({ padraoRecorrencia: "2", diaSemana: "4" }));
    expect(payload.diasDaSemana).toEqual(["4"]);
    expect(payload.padrao).toBe("2");
    expect(payload.padraoRecorrenciaMensal).toBe("2");
  });
});

describe("textoDiasSemana", () => {
  it("descreve um, dois e vários dias", () => {
    const dias = [
      { descricao: "Segunda-feira" },
      { descricao: "Quarta-feira" },
      { descricao: "Sexta-feira" },
    ];
    expect(textoDiasSemana([])).toBe("");
    expect(textoDiasSemana(dias.slice(0, 1))).toBe("Ocorre a cada Segunda-feira");
    expect(textoDiasSemana(dias.slice(0, 2))).toBe("Ocorre a cada Segunda-feira e Quarta-feira");
    expect(textoDiasSemana(dias)).toBe(
      "Ocorre a cada Segunda-feira, Quarta-feira e Sexta-feira",
    );
  });
});
