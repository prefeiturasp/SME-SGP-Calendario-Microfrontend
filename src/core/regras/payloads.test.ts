import { describe, expect, it } from "vitest";
import { dayjs } from "../datas";
import { APLICACAO_SGP } from "../constantes";
import { aplicarDatasNoFechamento } from "./fechamentoAbertura";
import { montarCadastroPeriodo, valoresPorBimestre } from "./periodoEscolar";

describe("payloads do calendário", () => {
  it("monta o cadastro semestral e anual de período escolar", () => {
    const calendario = { id: 9, descricao: "2026", anoLetivo: 2026, periodo: 2 };
    const dados = {
      primeiroBimestreDataInicial: dayjs("2026-02-01"),
      primeiroBimestreDataFinal: dayjs("2026-04-01"),
      segundoBimestreDataInicial: dayjs("2026-04-02"),
      segundoBimestreDataFinal: dayjs("2026-06-30"),
      terceiroBimestreDataInicial: dayjs("2026-07-01"),
      terceiroBimestreDataFinal: dayjs("2026-09-30"),
      quartoBimestreDataInicial: dayjs("2026-10-01"),
      quartoBimestreDataFinal: dayjs("2026-12-20"),
    };

    expect(montarCadastroPeriodo(calendario, dados, false).periodos).toHaveLength(2);
    const anual = montarCadastroPeriodo({ ...calendario, periodo: 1 }, dados, true);
    expect(anual.tipoCalendario).toBe(9);
    expect(anual.anoBase).toBe(2026);
    expect(anual.periodos[3].bimestre).toBe(4);
    expect(anual.periodos[3].periodoFim).toBeInstanceOf(Date);
  });

  it("reidrata os campos a partir dos bimestres consultados", () => {
    const valores = valoresPorBimestre({
      periodos: [
        {
          id: 1,
          bimestre: 1,
          periodoInicio: "2026-02-01",
          periodoFim: "2026-04-01",
        },
      ],
    });
    expect(valores.primeiroBimestreDataInicial).toBe("2026-02-01");
  });

  it("envia a abertura para a aplicação SGP com as datas convertidas", () => {
    const payload = aplicarDatasNoFechamento({
      id: 3,
      fechamentosBimestres: [{ bimestre: 1, inicioMinimo: dayjs("2026-02-01"), finalMaximo: dayjs("2026-04-30") }],
      bimestre1InicioDoFechamento: dayjs("2026-03-01"),
      bimestre1FinalDoFechamento: dayjs("2026-03-20"),
    });

    expect(payload.aplicacao).toBe(APLICACAO_SGP);
    expect(payload.confirmouAlteracaoHierarquica).toBe(false);
    expect(payload.fechamentosBimestres[0].inicioDoFechamento).toBeInstanceOf(Date);
    expect((payload as Record<string, unknown>).bimestre1InicioDoFechamento).toBeInstanceOf(
      Date,
    );
  });
});
