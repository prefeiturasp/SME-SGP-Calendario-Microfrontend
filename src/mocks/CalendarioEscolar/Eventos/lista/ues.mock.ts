import type { OpcaoAbrangencia } from "./tipos";

// Chave = código da DRE. A DRE 100003 tem uma única UE (testa auto-seleção/campo desabilitado).
export const uesPorDreMock: Record<string, OpcaoAbrangencia[]> = {
  "100001": [
    { codigo: "900001", nome: "EMEF FICTICIA DE TESTE NORTE I" },
    { codigo: "900002", nome: "EMEF FICTICIA DE TESTE NORTE II" },
    { codigo: "900003", nome: "EMEI FICTICIA DE TESTE NORTE" },
  ],
  "100002": [
    { codigo: "900011", nome: "EMEF FICTICIA DE TESTE SUL I" },
    { codigo: "900012", nome: "CEU EMEF FICTICIA DE TESTE SUL" },
  ],
  "100003": [{ codigo: "900021", nome: "EMEF FICTICIA DE TESTE LESTE" }],
};
