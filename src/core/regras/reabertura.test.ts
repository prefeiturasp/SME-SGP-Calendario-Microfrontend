import { describe, expect, it } from "vitest";
import { OPCAO_TODOS } from "../constantes";
import {
  bimestresMarcados,
  bimestresParaSalvar,
  mesclarAbrangencias,
  montarListaBimestres,
  onchangeMultiSelect,
  ordenarPorNome,
} from "./reabertura";

describe("regras da reabertura", () => {
  it("trata a opção todos no multisseleção", () => {
    const definir = (valores: string[]) => {
      recebidos = valores;
    };
    let recebidos: string[] = [];

    onchangeMultiSelect(["1", OPCAO_TODOS], ["1"], definir);
    expect(recebidos).toEqual([OPCAO_TODOS]);

    onchangeMultiSelect([OPCAO_TODOS, "2"], [OPCAO_TODOS], definir);
    expect(recebidos).toEqual(["2"]);
  });

  it("monta bimestres anuais e semestrais e expande todos ao salvar", () => {
    expect(montarListaBimestres(false).map((item) => item.valor)).toEqual([
      "1",
      "2",
      "3",
      "4",
      OPCAO_TODOS,
    ]);
    expect(montarListaBimestres(true)).toHaveLength(3);
    expect(
      bimestresParaSalvar([OPCAO_TODOS], montarListaBimestres(true)),
    ).toEqual([1, 2]);
    expect(bimestresParaSalvar(["1", "3"], montarListaBimestres(false))).toEqual([1, 3]);
  });

  it("converte o array booleano da consulta nos bimestres marcados", () => {
    expect(bimestresMarcados([true, false, true, false])).toEqual([1, 3]);
  });

  it("mescla abrangências sem repetir código e ordena pelo nome", () => {
    const lista = mesclarAbrangencias(
      [{ codigo: "1", nome: "Zona Norte" }],
      [
        { codigo: "1", nome: "Zona Norte" },
        { codigo: "2", nome: "Butantã" },
      ],
    );
    expect(lista.map((item) => item.codigo)).toEqual(["1", "2"]);
    expect([...lista].sort(ordenarPorNome("nome")).map((item) => item.nome)).toEqual([
      "Butantã",
      "Zona Norte",
    ]);
  });
});
