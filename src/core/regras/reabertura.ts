import { OPCAO_TODOS, comoLista } from "../constantes";

export const onchangeMultiSelect = (
  valores: string[],
  valorAtual: string[] | undefined,
  definir: (valores: string[]) => void,
) => {
  let valorParaSetar = valores;
  const valorAtualTemOpcaoTodos = valorAtual?.includes(OPCAO_TODOS);
  const valoresTemOpcaoTodos = valores.includes(OPCAO_TODOS);

  if (valorAtualTemOpcaoTodos) {
    valorParaSetar = valores.filter((valor) => valor !== OPCAO_TODOS);
  }
  if (!valorAtualTemOpcaoTodos && valoresTemOpcaoTodos) {
    valorParaSetar = [OPCAO_TODOS];
  }

  definir(valorParaSetar);
};

export const ordenarPorNome = <T extends Record<string, unknown>>(indice: keyof T) => {
  return (a: T, b: T) => {
    if (!(indice in a) || !(indice in b)) return 0;
    const itemA = typeof a[indice] === "string" ? String(a[indice]).toUpperCase() : a[indice];
    const itemB = typeof b[indice] === "string" ? String(b[indice]).toUpperCase() : b[indice];
    if (itemA > itemB) return 1;
    if (itemA < itemB) return -1;
    return 0;
  };
};

export type Abrangencia = { codigo?: string; nome?: string };

export const mesclarAbrangencias = (
  atuais: Abrangencia[] | undefined,
  historicas: Abrangencia[] | undefined,
) => {
  const merged: Abrangencia[] = [];
  comoLista<Abrangencia>(atuais).forEach((item, indice) => {
    merged[indice] = item;
  });
  comoLista<Abrangencia>(historicas).forEach((item, indice) => {
    if (!merged.some((existente) => existente?.codigo === item?.codigo)) {
      merged[indice] = item;
    }
  });
  return Object.values(merged).filter(Boolean);
};

export const bimestresMarcados = (bimestres: boolean[] | undefined) => {
  const selecionados: number[] = [];
  (bimestres || []).forEach((marcado, indice) => {
    if (marcado) selecionados.push(indice + 1);
  });
  return selecionados;
};

export const bimestresParaSalvar = (
  selecionados: string[],
  lista: { valor: string }[],
) => {
  if (selecionados.includes(OPCAO_TODOS) && lista.length) {
    return lista
      .filter((item) => item.valor !== OPCAO_TODOS)
      .map((item) => Number(item.valor));
  }
  return selecionados.map((item) => Number(item));
};

export const montarListaBimestres = (ejaOuCelp: boolean) => {
  const lista = [
    { valor: "1", descricao: "Primeiro Bimestre" },
    { valor: "2", descricao: "Segundo Bimestre" },
  ];
  if (!ejaOuCelp) {
    lista.push(
      { valor: "3", descricao: "Terceiro Bimestre" },
      { valor: "4", descricao: "Quarto Bimestre" },
    );
  }
  lista.push({ valor: OPCAO_TODOS, descricao: "Todos" });
  return lista;
};
