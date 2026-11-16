import { describe, expect, it } from "vitest";
import { periodoEscolarService as fonte } from "./periodoEscolarService";
import type { CadastroPeriodosEscolares } from "../core/periodoEscolar";

const cadastro = (): CadastroPeriodosEscolares => ({
  tipoCalendario: 2,
  anoBase: 2026,
  periodos: [
    {
      id: 0,
      bimestre: 1,
      periodoInicio: "2026-02-04",
      periodoFim: "2026-04-30",
    },
    {
      id: 0,
      bimestre: 2,
      periodoInicio: "2026-05-04",
      periodoFim: "2026-07-04",
    },
    {
      id: 0,
      bimestre: 3,
      periodoInicio: "2026-07-18",
      periodoFim: "2026-09-30",
    },
    {
      id: 0,
      bimestre: 4,
      periodoInicio: "2026-10-01",
      periodoFim: "2026-12-22",
    },
  ],
});

const mensagem = (texto: string) => ({
  response: { data: { mensagens: [texto] } },
});

describe("fonte mockada de períodos escolares", () => {
  it("oferece cenários de cadastro e edição anuais e semestrais e filtra o calendário", async () => {
    expect(await fonte.listarCalendarios()).toHaveLength(4);
    expect(
      (await fonte.listarCalendarios("  infantil  ")).map((item) => item.id)
    ).toEqual([1]);
    expect(await fonte.listarCalendarios("inexistente")).toEqual([]);
    expect((await fonte.obterPorTipoCalendario("1"))?.periodos).toHaveLength(4);
    expect((await fonte.obterPorTipoCalendario(3))?.periodos).toHaveLength(2);
    expect(await fonte.obterPorTipoCalendario(2)).toBeNull();
    expect(await fonte.obterPorTipoCalendario(4)).toBeNull();
  });

  it("retorna as datas do protótipo e cópias independentes em cada consulta", async () => {
    const calendario = (await fonte.listarCalendarios())[0];
    calendario.descricao = "Alterado no consumidor";
    const periodo = (await fonte.obterPorTipoCalendario(1))!;
    expect(periodo.periodos?.[0].periodoInicio).toBe("2026-02-04");
    periodo.periodos![0].periodoFim = "2026-04-29";
    expect(
      (await fonte.obterPorTipoCalendario(1))?.periodos?.[0].periodoFim
    ).toBe("2026-04-30");
    expect((await fonte.listarCalendarios())[0].descricao).toContain(
      "INFANTIL"
    );
  });

  it("simula cadastro sem modificar o payload ou persistir os bimestres", async () => {
    const dados = cadastro();
    const original = structuredClone(dados);
    const resultado = await fonte.salvar(dados);
    expect(resultado.periodos).toHaveLength(4);
    expect(resultado.periodos?.[0].id).toBeGreaterThan(0);
    expect(resultado.criadoPor).toBe("Usuário de demonstração");
    expect(dados).toEqual(original);
    expect(await fonte.obterPorTipoCalendario(2)).toBeNull();
  });

  it("simula edição sem alterar os dados de referência", async () => {
    const referencia = (await fonte.obterPorTipoCalendario(1))!;
    const dados = {
      ...cadastro(),
      tipoCalendario: 1,
      periodos: referencia.periodos!,
    };
    dados.periodos[0].periodoFim = "2026-04-29";
    const resultado = await fonte.salvar(dados);
    expect(resultado.periodos?.[0].id).toBe(11);
    expect(resultado.periodos?.[0].periodoFim).toBe("2026-04-29");
    expect(resultado.alteradoEm).toBeTruthy();
    expect(
      (await fonte.obterPorTipoCalendario(1))?.periodos?.[0].periodoFim
    ).toBe("2026-04-30");
  });

  it.each(["2026-04-30", "2026-04-20"])(
    "rejeita sobreposição inclusive no limite %s",
    async (inicio) => {
      const dados = cadastro();
      dados.periodos[1].periodoInicio = inicio;
      await expect(fonte.salvar(dados)).rejects.toEqual(
        mensagem("As datas do 1º e do 2º bimestres se sobrepõem.")
      );
      expect(await fonte.obterPorTipoCalendario(2)).toBeNull();
    }
  );

  it("detecta sobreposição de bimestres não consecutivos", async () => {
    const dados = cadastro();
    dados.periodos[2].periodoInicio = "2026-02-10";
    await expect(fonte.salvar(dados)).rejects.toEqual(
      mensagem("As datas do 1º e do 3º bimestres se sobrepõem.")
    );
  });

  it("aceita bimestre de um dia e exige o início seguinte depois do fim anterior", async () => {
    const dados = cadastro();
    dados.periodos[0].periodoFim = "2026-02-04";
    dados.periodos[1].periodoInicio = "2026-02-05";
    await expect(fonte.salvar(dados)).resolves.toHaveProperty(
      "tipoCalendario",
      2
    );
  });

  it("valida obrigatoriedade, fim anterior ao início, ano, quantidade e numeração", async () => {
    const dados = cadastro();
    dados.periodos[0].periodoInicio = "";
    await expect(fonte.salvar(dados)).rejects.toEqual(
      mensagem("1º Bimestre: informe as datas de início e fim.")
    );
    dados.periodos[0].periodoInicio = "2026-05-01";
    await expect(fonte.salvar(dados)).rejects.toEqual(
      mensagem(
        "1º Bimestre: a data de início não pode ser posterior à data de fim."
      )
    );
    dados.periodos[0].periodoInicio = "2025-02-04";
    await expect(fonte.salvar(dados)).rejects.toEqual(
      mensagem(
        "1º Bimestre: as datas devem pertencer ao ano do calendário (2026)."
      )
    );
    await expect(fonte.salvar({ ...cadastro(), periodos: [] })).rejects.toEqual(
      mensagem("Informe os 4 bimestres do calendário.")
    );
    const duplicados = cadastro();
    duplicados.periodos[3].bimestre = 1;
    await expect(fonte.salvar(duplicados)).rejects.toEqual(
      mensagem("Informe os 4 bimestres do calendário.")
    );
  });

  it("simula o calendário semestral apenas com dois bimestres", async () => {
    const dados = {
      ...cadastro(),
      tipoCalendario: 4,
      periodos: cadastro()
        .periodos.slice(2)
        .map((item, indice) => ({ ...item, bimestre: indice + 1 })),
    };
    expect((await fonte.salvar(dados)).periodos).toHaveLength(2);
    expect(await fonte.obterPorTipoCalendario(4)).toBeNull();
  });

  it("rejeita calendário desconhecido e bimestres fora de ordem cronológica", async () => {
    await expect(fonte.obterPorTipoCalendario(999)).rejects.toEqual(
      mensagem("Selecione um calendário válido.")
    );
    await expect(
      fonte.salvar({ ...cadastro(), tipoCalendario: 999 })
    ).rejects.toEqual(mensagem("Selecione um calendário válido."));
    const dados = cadastro();
    const primeiro = dados.periodos[0];
    dados.periodos[0] = { ...dados.periodos[1], bimestre: 1 };
    dados.periodos[1] = { ...primeiro, bimestre: 2 };
    await expect(fonte.salvar(dados)).rejects.toEqual(
      mensagem("Os bimestres devem seguir a ordem cronológica do calendário.")
    );
  });
});
