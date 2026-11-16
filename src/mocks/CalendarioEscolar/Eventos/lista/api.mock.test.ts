import { beforeEach, describe, expect, it } from "vitest";
import { apiMock, configurarLatencia, restaurarEventos } from "./api.mock";

const SME = { tipoCalendarioId: 1, ehTodasDres: true, ehTodasUes: true };
const nomes = (r: { data: { items: { nome: string }[] } }) => r.data.items.map((e) => e.nome);

beforeEach(() => {
  configurarLatencia(0);
  restaurarEventos();
});

describe("apiMock.eventos", () => {
  it("pagina o calendário 1 sem recorte de abrangência (30 eventos)", async () => {
    const p1 = await apiMock.eventos(1, 10, { tipoCalendarioId: 1 });
    expect(p1.data.totalRegistros).toBe(30);
    expect(p1.data.items).toHaveLength(10);
    const p3 = await apiMock.eventos(3, 10, { tipoCalendarioId: 1 });
    expect(p3.data.items).toHaveLength(10);
    const p4 = await apiMock.eventos(4, 10, { tipoCalendarioId: 1 });
    expect(p4.data.items).toHaveLength(0);
  });

  it("SME (Todas/Todas) devolve todo o calendário", async () => {
    const r = await apiMock.eventos(1, 100, SME);
    expect(r.data.totalRegistros).toBe(30);
  });

  it("ordena por data de início e desempata por id", async () => {
    const r = await apiMock.eventos(1, 100, SME);
    const chaves = r.data.items.map((e) => `${e.dataInicio}|${String(e.id).padStart(4, "0")}`);
    expect(chaves).toEqual([...chaves].sort());
  });

  it("DRE + Todas as UEs traz a DRE, suas UEs e a rede", async () => {
    const r = await apiMock.eventos(1, 100, {
      tipoCalendarioId: 1,
      dreId: "100001",
      ehTodasUes: true,
    });
    expect(r.data.totalRegistros).toBe(17); // 6 rede + 3 DRE + 8 UE
    expect(r.data.items.every((e) => e.dreId === "100001" || e.dreId === null)).toBe(true);
  });

  it("DRE + UE traz só a UE e a rede", async () => {
    const r = await apiMock.eventos(1, 100, {
      tipoCalendarioId: 1,
      dreId: "100001",
      ueId: "900001",
    });
    expect(r.data.totalRegistros).toBe(9); // 6 rede + 3 UE
    expect(r.data.items.every((e) => e.ueId === "900001" || e.dreId === null)).toBe(true);
  });

  it("ehEventosTodaRede devolve só eventos de rede", async () => {
    const r = await apiMock.eventos(1, 100, { ...SME, ehEventosTodaRede: true });
    expect(r.data.totalRegistros).toBe(6);
    expect(r.data.items.every((e) => e.dreId === null && e.ueId === null)).toBe(true);
  });

  it("filtra por tipo de evento", async () => {
    const r = await apiMock.eventos(1, 100, { ...SME, tipoEventoId: "1" });
    expect(nomes(r)).toEqual(["Carnaval", "Tiradentes", "Dia do Trabalho"]);
  });

  it("busca por nome ignora acento e caixa", async () => {
    const r = await apiMock.eventos(1, 100, { ...SME, nomeEvento: "REUNIAO" });
    expect(r.data.totalRegistros).toBeGreaterThan(1);
    expect(nomes(r).every((n) => /reuni/i.test(n))).toBe(true);
  });

  it("período inclui por sobreposição, inclusive evento que cruza o mês", async () => {
    // "Recesso escolar de outubro" vai de 27/10 a 02/11
    const r = await apiMock.eventos(1, 100, {
      ...SME,
      dataInicio: "11-01-2025",
      dataFim: "11-01-2025",
    });
    expect(nomes(r)).toEqual(["Recesso escolar de outubro"]);
  });

  it("período sem eventos devolve vazio", async () => {
    const r = await apiMock.eventos(1, 100, {
      ...SME,
      dataInicio: "01-01-2025",
      dataFim: "01-31-2025",
    });
    expect(r.data).toEqual({ items: [], totalRegistros: 0 });
  });

  it("calendário 3 não tem eventos", async () => {
    const r = await apiMock.eventos(1, 10, {
      tipoCalendarioId: 3,
      ehTodasDres: true,
      ehTodasUes: true,
    });
    expect(r.data).toEqual({ items: [], totalRegistros: 0 });
  });

  it("excluir remove o evento das consultas seguintes", async () => {
    await apiMock.excluir([101]);
    const r = await apiMock.eventos(1, 100, SME);
    expect(r.data.totalRegistros).toBe(29);
    expect(r.data.items.some((e) => e.id === 101)).toBe(false);
  });
});

describe("apiMock — listas de apoio", () => {
  it("DRE 100003 tem uma única UE", async () => {
    expect((await apiMock.ues("100003")).data).toHaveLength(1);
  });

  it("devolve os tipos de evento no formato { items }", async () => {
    expect((await apiMock.tiposEvento()).data.items).toHaveLength(10);
  });

  it("filtra calendários sem diferenciar acento/caixa", async () => {
    const r = await apiMock.tiposCalendario("calendario de atividades - eja");
    expect(r.data.map((c) => c.id)).toEqual([2]);
  });
});
