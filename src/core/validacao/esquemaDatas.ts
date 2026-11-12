import * as Yup from "yup";
import { inicioNaoAnterior, inicioPosterior, paraDia } from "../datas";

export const esquemaDataObrigatoria = (mensagem: string) =>
  Yup.mixed().test("obrigatoria", mensagem, (valor) => !!paraDia(valor as never));

export const dataMenorQue = (
  nomeDataInicial: string,
  nomeDataFinal: string,
  mensagem: string,
) =>
  Yup.mixed().test("dataMenorQue", mensagem, function validar() {
    const dataInicial = this.parent[nomeDataInicial];
    const dataFinal = this.parent[nomeDataFinal];
    if (dataInicial && dataFinal && inicioPosterior(dataInicial, dataFinal)) {
      return false;
    }
    return true;
  });

export const dataMenorIgualQue = (
  nomeDataInicial: string,
  nomeDataFinal: string,
  mensagem: string,
) =>
  Yup.mixed().test("dataMenorIgualQue", mensagem, function validar() {
    const dataInicial = this.parent[nomeDataInicial];
    const dataFinal = this.parent[nomeDataFinal];
    if (dataInicial && dataFinal && inicioNaoAnterior(dataInicial, dataFinal)) {
      return false;
    }
    return true;
  });

const campoPeriodo = (
  nomeInicio: string,
  nomeFim: string,
  nomeInicioAnterior?: string,
) => {
  const inicio = nomeInicioAnterior
    ? esquemaDataObrigatoria("Data inicial obrigatória").concat(
        dataMenorIgualQue(nomeInicioAnterior, nomeInicio, "Data inválida"),
      )
    : esquemaDataObrigatoria("Data inicial obrigatória");

  return {
    [nomeInicio]: inicio,
    [nomeFim]: esquemaDataObrigatoria("Data final obrigatória").concat(
      dataMenorQue(nomeInicio, nomeFim, "Data inválida"),
    ),
  };
};

export const esquemaPeriodosEscolares = (anual: boolean) =>
  Yup.object().shape({
    ...campoPeriodo("primeiroBimestreDataInicial", "primeiroBimestreDataFinal"),
    ...campoPeriodo(
      "segundoBimestreDataInicial",
      "segundoBimestreDataFinal",
      "primeiroBimestreDataFinal",
    ),
    ...(anual
      ? {
          ...campoPeriodo(
            "terceiroBimestreDataInicial",
            "terceiroBimestreDataFinal",
            "segundoBimestreDataFinal",
          ),
          ...campoPeriodo(
            "quartoBimestreDataInicial",
            "quartoBimestreDataFinal",
            "terceiroBimestreDataFinal",
          ),
        }
      : {}),
  });

export const esquemaFechamentoAbertura = (anual: boolean) =>
  Yup.object().shape({
    ...campoPeriodo("bimestre1InicioDoFechamento", "bimestre1FinalDoFechamento"),
    ...campoPeriodo(
      "bimestre2InicioDoFechamento",
      "bimestre2FinalDoFechamento",
      "bimestre1FinalDoFechamento",
    ),
    ...(anual
      ? {
          ...campoPeriodo(
            "bimestre3InicioDoFechamento",
            "bimestre3FinalDoFechamento",
            "bimestre2FinalDoFechamento",
          ),
          ...campoPeriodo(
            "bimestre4InicioDoFechamento",
            "bimestre4FinalDoFechamento",
            "bimestre3FinalDoFechamento",
          ),
        }
      : {}),
  });
