import { APLICACAO_SGP } from "../constantes";
import { paraDataApi, type ValorData } from "../datas";

export type FechamentoBimestre = {
  bimestre: number;
  inicioDoFechamento?: ValorData;
  finalDoFechamento?: ValorData;
  inicioMinimo?: ValorData;
  finalMaximo?: ValorData;
};

export type FechamentoAbertura = {
  id?: number;
  tipoCalendarioId?: number | null;
  migrado?: boolean;
  fechamentosBimestres: FechamentoBimestre[];
  criadoEm?: string;
  criadoPor?: string;
  criadoRF?: string;
  alteradoPor?: string;
  alteradoEm?: string;
  alteradoRF?: string;
  [chave: string]: unknown;
};

const chaveInicio = (bimestre: number) => `bimestre${bimestre}InicioDoFechamento`;
const chaveFim = (bimestre: number) => `bimestre${bimestre}FinalDoFechamento`;

export const aplicarDatasNoFechamento = (dados: FechamentoAbertura) => {
  dados.fechamentosBimestres.forEach((item) => {
    const inicio = paraDataApi(dados[chaveInicio(item.bimestre)] as ValorData);
    const fim = paraDataApi(dados[chaveFim(item.bimestre)] as ValorData);
    if (inicio) item.inicioDoFechamento = inicio;
    if (fim) item.finalDoFechamento = fim;
    const minimo = paraDataApi(item.inicioMinimo);
    const maximo = paraDataApi(item.finalMaximo);
    if (minimo) item.inicioMinimo = minimo;
    if (maximo) item.finalMaximo = maximo;
  });

  Object.keys(dados).forEach((chave) => {
    if (!chave.startsWith("bimestre")) return;
    const data = paraDataApi(dados[chave] as ValorData);
    if (data) dados[chave] = data;
  });

  return {
    ...dados,
    confirmouAlteracaoHierarquica: false,
    aplicacao: APLICACAO_SGP,
  };
};
