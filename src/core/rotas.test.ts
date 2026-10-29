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

  it("ignora rotas de calendário fora desta etapa", () => {
    expect(resolverTela("/calendario-escolar/eventos")).toBeNull();
  });
});
