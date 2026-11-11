import type { TipoCalendario } from "../core/constantes";
import type { CadastroTipoCalendario } from "../services/calendarioService";

export type TipoCalendarioMockado = TipoCalendario & {
  nome?: string;
  descricaoPeriodo?: string;
};

const tiposCalendarioMockados: TipoCalendarioMockado[] = [
  {
    id: 1,
    descricao: "Calendário anual",
    nome: "Calendário anual",
    anoLetivo: 2026,
    descricaoPeriodo: "Anual",
  },
  {
    id: 2,
    descricao: "Calendário semestral",
    nome: "Calendário semestral",
    anoLetivo: 2026,
    descricaoPeriodo: "Semestral",
  },
];

export const obterTiposCalendarioMockados = () => [...tiposCalendarioMockados];

export const salvarTipoCalendarioMockado = (dados: CadastroTipoCalendario) => {
  const maiorId = Math.max(
    0,
    ...tiposCalendarioMockados.map((tipo) => tipo.id),
  );
  const id = Number(dados.id) || maiorId + 1;
  const tipo: TipoCalendarioMockado = {
    id,
    descricao: dados.nome,
    nome: dados.nome,
    anoLetivo: Number(dados.anoLetivo),
    periodo: dados.periodo,
    modalidade: Number(dados.modalidade),
    descricaoPeriodo: dados.periodo === 1 ? "Anual" : "Semestral",
  };
  const indiceExistente = tiposCalendarioMockados.findIndex(
    (item) => item.id === id,
  );

  if (indiceExistente >= 0) tiposCalendarioMockados[indiceExistente] = tipo;
  else tiposCalendarioMockados.push(tipo);
};
