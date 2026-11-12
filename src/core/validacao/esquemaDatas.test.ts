import { describe, expect, it } from "vitest";
import { dayjs } from "../datas";
import { esquemaFechamentoAbertura, esquemaPeriodosEscolares } from "./esquemaDatas";

const dia = (valor: string) => dayjs(valor, "YYYY-MM-DD");

describe("esquema de períodos escolares", () => {
  it("aceita o mesmo dia no início e no fim do bimestre e rejeita fim anterior ao início", async () => {
    const esquema = esquemaPeriodosEscolares(false);
    await expect(
      esquema.validate({
        primeiroBimestreDataInicial: dia("2026-02-01"),
        primeiroBimestreDataFinal: dia("2026-02-01"),
        segundoBimestreDataInicial: dia("2026-02-02"),
        segundoBimestreDataFinal: dia("2026-04-01"),
      }),
    ).resolves.toBeTruthy();

    await expect(
      esquema.validate({
        primeiroBimestreDataInicial: dia("2026-02-10"),
        primeiroBimestreDataFinal: dia("2026-02-01"),
        segundoBimestreDataInicial: dia("2026-02-11"),
        segundoBimestreDataFinal: dia("2026-04-01"),
      }),
    ).rejects.toBeTruthy();
  });

  it("exige que o bimestre seguinte comece depois do fim do anterior", async () => {
    const esquema = esquemaPeriodosEscolares(false);
    await expect(
      esquema.validate({
        primeiroBimestreDataInicial: dia("2026-02-01"),
        primeiroBimestreDataFinal: dia("2026-04-01"),
        segundoBimestreDataInicial: dia("2026-04-01"),
        segundoBimestreDataFinal: dia("2026-06-01"),
      }),
    ).rejects.toBeTruthy();
  });

  it("no calendário semestral não exige o terceiro e o quarto bimestres", async () => {
    const esquema = esquemaPeriodosEscolares(false);
    await expect(
      esquema.validate({
        primeiroBimestreDataInicial: dia("2026-02-01"),
        primeiroBimestreDataFinal: dia("2026-04-01"),
        segundoBimestreDataInicial: dia("2026-04-02"),
        segundoBimestreDataFinal: dia("2026-06-01"),
      }),
    ).resolves.toBeTruthy();
  });

  it("exige os quatro bimestres quando o fechamento é anual", async () => {
    const esquema = esquemaFechamentoAbertura(true);
    await expect(
      esquema.validate({
        bimestre1InicioDoFechamento: dia("2026-02-01"),
        bimestre1FinalDoFechamento: dia("2026-04-01"),
        bimestre2InicioDoFechamento: dia("2026-04-02"),
        bimestre2FinalDoFechamento: dia("2026-06-01"),
      }),
    ).rejects.toBeTruthy();
  });
});
