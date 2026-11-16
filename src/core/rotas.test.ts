import { describe, expect, it } from "vitest";
import { ROTAS } from "./constantes";
import { resolverTela } from "./rotas";

describe("resolverTela", () => {
  it("encaminha somente a listagem de feriados, incluindo a barra final", () => {
    expect(resolverTela("/calendario-escolar/tipo-feriado")).toBe("tipo-feriado");
    expect(resolverTela("/calendario-escolar/tipo-feriado/")).toBe("tipo-feriado");
    expect(resolverTela("/calendario-escolar/tipo-feriado/novo")).toBeNull();
    expect(resolverTela("/calendario-escolar/tipo-feriado/editar/1")).toBeNull();
  });
  it("encaminha as três rotas do calendário e o cadastro da reabertura", () => {
    expect(resolverTela(ROTAS.PERIODOS_ESCOLARES)).toBe("periodos-escolares");
    expect(resolverTela(`${ROTAS.PERIODOS_ESCOLARES}/`)).toBe("periodos-escolares");
    expect(resolverTela(ROTAS.PERIODO_FECHAMENTO_ABERTURA)).toBe(
      "periodo-fechamento-abertura",
    );
    expect(resolverTela(ROTAS.PERIODO_FECHAMENTO_REABERTURA)).toBe(
      "periodo-fechamento-reabertura",
    );
    expect(resolverTela(`${ROTAS.PERIODO_FECHAMENTO_REABERTURA}/novo/`)).toBe(
      "periodo-fechamento-reabertura-cadastro",
    );
    expect(resolverTela(`${ROTAS.PERIODO_FECHAMENTO_REABERTURA}/novo/10`)).toBe(
      "periodo-fechamento-reabertura-cadastro",
    );
    expect(resolverTela(`${ROTAS.PERIODO_FECHAMENTO_REABERTURA}/editar/4`)).toBe(
      "periodo-fechamento-reabertura-cadastro",
    );
    expect(resolverTela(ROTAS.TIPO_CALENDARIO_ESCOLAR)).toBe(
      "tipo-calendario-escolar",
    );
    expect(resolverTela(`${ROTAS.TIPO_CALENDARIO_ESCOLAR}/novo`)).toBe(
      "tipo-calendario-escolar-cadastro",
    );
    expect(resolverTela(`${ROTAS.TIPO_CALENDARIO_ESCOLAR}/editar/4`)).toBe(
      "tipo-calendario-escolar-cadastro",
    );
  });

  it("encaminha a listagem e o formulário de tipo de eventos", () => {
    expect(resolverTela(ROTAS.TIPO_EVENTOS)).toBe("tipo-eventos");
    expect(resolverTela(`${ROTAS.TIPO_EVENTOS}/novo`)).toBe("tipo-eventos-formulario");
    expect(resolverTela(`${ROTAS.TIPO_EVENTOS}/novo/`)).toBe("tipo-eventos-formulario");
    expect(resolverTela(`${ROTAS.TIPO_EVENTOS}/editar/3`)).toBe("tipo-eventos-formulario");
  });

  it("encaminha a lista de eventos, com ou sem tipo de calendário", () => {
    expect(resolverTela(ROTAS.EVENTOS)).toBe("eventos");
    expect(resolverTela(`${ROTAS.EVENTOS}/`)).toBe("eventos");
    expect(resolverTela(`${ROTAS.EVENTOS}/10`)).toBe("eventos");
  });

  it("encaminha o cadastro de eventos (novo e edição)", () => {
    expect(resolverTela(`${ROTAS.EVENTOS}/novo/1`)).toBe("evento-cadastro");
    expect(resolverTela(`${ROTAS.EVENTOS}/editar/5`)).toBe("evento-cadastro");
    expect(resolverTela(`${ROTAS.EVENTOS}/editar/5/1`)).toBe("evento-cadastro");
  });

  it("ignora rotas de calendário fora desta etapa", () => {
    expect(resolverTela("/calendario-escolar/tipo-eventos")).toBeNull();
  });
});
