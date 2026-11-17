import { describe, expect, it } from "vitest";
import { tipoFeriadoService } from "./tipoFeriadoService";

const consultaInicial = {
  nome: "",
  abrangencia: 0 as const,
  tipo: 0 as const,
  pagina: 1,
  tamanhoPagina: 10,
};

describe("consulta mockada de tipos de feriado", () => {
  it("entrega a primeira página na ordem da referência e informa o total", async () => {
    const resposta = await tipoFeriadoService.listar(consultaInicial);

    expect(resposta.total).toBe(40);
    expect(resposta.itens).toHaveLength(10);
    expect(resposta.itens[0]).toEqual({
      id: 1,
      nome: "Confraternização universal",
      descricaoAbrangencia: "Nacional",
      descricaoTipo: "Fixo",
    });
    expect(resposta.itens[9].nome).toBe("Consciência Negra (Municipal)");
  });

  it.each([
    [1, "Nacional"],
    [2, "Estadual"],
    [3, "Municipal"],
  ] as const)("filtra a abrangência %s antes de paginar", async (abrangencia, descricao) => {
    const resposta = await tipoFeriadoService.listar({
      ...consultaInicial,
      abrangencia,
      tamanhoPagina: 100,
    });

    expect(resposta.itens.length).toBeGreaterThan(0);
    expect(resposta.itens.every((item) => item.descricaoAbrangencia === descricao)).toBe(true);
    expect(resposta.total).toBe(resposta.itens.length);
  });

  it("combina nome, abrangência e tipo, sem diferenciar caixa ou espaços externos", async () => {
    const resposta = await tipoFeriadoService.listar({
      ...consultaInicial,
      nome: "  SÃO PAULO  ",
      abrangencia: 3,
      tipo: 1,
    });

    expect(resposta).toEqual({
      total: 1,
      itens: [
        {
          id: 2,
          nome: "Aniversário de São Paulo",
          descricaoAbrangencia: "Municipal",
          descricaoTipo: "Fixo",
        },
      ],
    });
    expect(
      await tipoFeriadoService.listar({ ...consultaInicial, nome: "São Paulo", tipo: 2 })
    ).toEqual({ itens: [], total: 0 });
  });

  it("disponibiliza tipos móveis sem alterar os registros fixos da referência", async () => {
    const resposta = await tipoFeriadoService.listar({ ...consultaInicial, tipo: 2 });

    expect(resposta.total).toBeGreaterThan(0);
    expect(resposta.itens.every((item) => item.descricaoTipo === "Móvel")).toBe(true);
    expect(resposta.itens.every((item) => item.nome.includes("demonstração"))).toBe(true);
  });

  it("retorna vazio para busca inexistente e restaura a lista ao limpar", async () => {
    expect(await tipoFeriadoService.listar({ ...consultaInicial, nome: "inexistente" })).toEqual({
      itens: [],
      total: 0,
    });
    expect((await tipoFeriadoService.listar(consultaInicial)).total).toBe(40);
  });

  it("recorta páginas sem repetir registros e preserva o total filtrado", async () => {
    const primeira = await tipoFeriadoService.listar(consultaInicial);
    const segunda = await tipoFeriadoService.listar({ ...consultaInicial, pagina: 2 });
    const ultima = await tipoFeriadoService.listar({ ...consultaInicial, pagina: 4 });
    const foraDoIntervalo = await tipoFeriadoService.listar({ ...consultaInicial, pagina: 5 });

    expect(segunda.itens.map((item) => item.id)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(ultima.itens.map((item) => item.id)).toEqual([31, 32, 33, 34, 35, 36, 37, 38, 39, 40]);
    expect(primeira.itens.some((item) => segunda.itens.some((outro) => outro.id === item.id))).toBe(
      false
    );
    expect(segunda.total).toBe(40);
    expect(foraDoIntervalo).toEqual({ itens: [], total: 40 });
  });

  it("não permite que uma alteração no resultado contamine a próxima consulta", async () => {
    const resposta = await tipoFeriadoService.listar(consultaInicial);
    resposta.itens[0].nome = "Alteração somente no consumidor";
    resposta.itens.pop();

    const repetida = await tipoFeriadoService.listar(consultaInicial);
    expect(repetida.itens[0].nome).toBe("Confraternização universal");
    expect(repetida.itens).toHaveLength(10);
    expect(repetida.total).toBe(40);
  });
});
