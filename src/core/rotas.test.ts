import { describe, expect, it } from "vitest";
import { ROTAS } from "./constantes";
import { resolverTela } from "./rotas";

describe("resolverTela", () => {
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
