import { ROTAS } from "./constantes";

export type TelaCalendario =
  | "periodos-escolares"
  | "periodo-fechamento-abertura"
  | "periodo-fechamento-reabertura"
  | "periodo-fechamento-reabertura-cadastro";

export const resolverTela = (pathname: string): TelaCalendario | null => {
  const caminho = pathname.replace(/\/+$/, "") || "/";

  if (
    caminho === ROTAS.PERIODOS_ESCOLARES ||
    caminho.startsWith(`${ROTAS.PERIODOS_ESCOLARES}/`)
  ) {
    return "periodos-escolares";
  }

  if (
    caminho === ROTAS.PERIODO_FECHAMENTO_ABERTURA ||
    caminho.startsWith(`${ROTAS.PERIODO_FECHAMENTO_ABERTURA}/`)
  ) {
    return "periodo-fechamento-abertura";
  }

  if (caminho.startsWith(`${ROTAS.PERIODO_FECHAMENTO_REABERTURA}/novo`)) {
    return "periodo-fechamento-reabertura-cadastro";
  }

  if (caminho.startsWith(`${ROTAS.PERIODO_FECHAMENTO_REABERTURA}/editar`)) {
    return "periodo-fechamento-reabertura-cadastro";
  }

  if (
    caminho === ROTAS.PERIODO_FECHAMENTO_REABERTURA ||
    caminho.startsWith(`${ROTAS.PERIODO_FECHAMENTO_REABERTURA}/`)
  ) {
    return "periodo-fechamento-reabertura";
  }

  return null;
};
