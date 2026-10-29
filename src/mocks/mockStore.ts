import { configureStore } from "@reduxjs/toolkit";
import type { RootState } from "../types/redux";

const estadoInicial: RootState = {
  usuario: {
    logado: true,
    token: "token-teste",
    possuiPerfilSme: true,
    possuiPerfilSmeOuDre: true,
    permissoes: {
      "/calendario-escolar/periodos-escolares": {
        podeConsultar: true,
        podeIncluir: true,
        podeAlterar: true,
        podeExcluir: true,
      },
      "/calendario-escolar/periodo-fechamento-abertura": {
        podeConsultar: true,
        podeIncluir: true,
        podeAlterar: true,
        podeExcluir: true,
      },
      "/calendario-escolar/periodo-fechamento-reabertura": {
        podeConsultar: true,
        podeIncluir: true,
        podeAlterar: true,
        podeExcluir: true,
      },
    },
  },
  navegacao: { rotaAtiva: "/calendario-escolar/periodos-escolares" },
};

export const createMockStore = (estado: RootState = estadoInicial) =>
  configureStore({
    reducer: (state: RootState = estado) => state,
  });
