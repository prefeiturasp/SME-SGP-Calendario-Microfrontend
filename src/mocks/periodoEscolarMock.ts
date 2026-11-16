import { ehCalendarioAnual, type TipoCalendario } from "../core/constantes";
import { paraDia } from "../core/datas";
import type {
  CadastroPeriodosEscolares,
  FontePeriodosEscolares,
} from "../core/periodoEscolar";
import type { PeriodoEscolarApi } from "../core/regras/periodoEscolar";

// Cenários independentes das telas de tipos de calendário. Nenhuma operação persiste dados.
const calendarios: TipoCalendario[] = [
  {
    id: 1,
    descricao: "2026 - INF - CALENDÁRIO DE ATIVIDADES 2026 - ED. INFANTIL",
    anoLetivo: 2026,
    periodo: 1,
    modalidade: 3,
  },
  {
    id: 2,
    descricao: "2026 - EF - CALENDÁRIO 2026 - ENSINO FUNDAMENTAL",
    anoLetivo: 2026,
    periodo: 1,
    modalidade: 1,
  },
  {
    id: 3,
    descricao: "2026 - EJA - CALENDÁRIO 2026 - 1º SEMESTRE",
    anoLetivo: 2026,
    periodo: 2,
    modalidade: 2,
  },
  {
    id: 4,
    descricao: "2026 - EJA - CALENDÁRIO 2026 - 2º SEMESTRE",
    anoLetivo: 2026,
    periodo: 2,
    modalidade: 2,
  },
];

const periodosReferencia: Record<number, PeriodoEscolarApi> = {
  1: {
    tipoCalendario: 1,
    anoBase: 2026,
    periodos: [
      {
        id: 11,
        bimestre: 1,
        periodoInicio: "2026-02-04",
        periodoFim: "2026-04-30",
      },
      {
        id: 12,
        bimestre: 2,
        periodoInicio: "2026-05-04",
        periodoFim: "2026-07-04",
      },
      {
        id: 13,
        bimestre: 3,
        periodoInicio: "2026-07-18",
        periodoFim: "2026-09-30",
      },
      {
        id: 14,
        bimestre: 4,
        periodoInicio: "2026-10-01",
        periodoFim: "2026-12-22",
      },
    ],
    criadoEm: "2026-01-19T18:55:00Z",
    criadoPor: "Usuário de demonstração",
    criadoRF: "0000000",
    alteradoEm: "2026-08-14T19:29:00Z",
    alteradoPor: "Usuário de demonstração",
    alteradoRF: "0000000",
  },
  3: {
    tipoCalendario: 3,
    anoBase: 2026,
    periodos: [
      {
        id: 31,
        bimestre: 1,
        periodoInicio: "2026-02-04",
        periodoFim: "2026-04-30",
      },
      {
        id: 32,
        bimestre: 2,
        periodoInicio: "2026-05-04",
        periodoFim: "2026-07-04",
      },
    ],
    criadoEm: "2026-01-19T18:55:00Z",
    criadoPor: "Usuário de demonstração",
    criadoRF: "0000000",
  },
};

const rejeitar = (mensagem: string): never => {
  // Mesmo formato de erro consumido pelos alertas atuais e pelo futuro adaptador de BFF.
  throw { response: { data: { mensagens: [mensagem] } } };
};

const obterCalendario = (id: number | string) =>
  calendarios.find((item) => String(item.id) === String(id)) ||
  rejeitar("Selecione um calendário válido.");

const salvar = async (
  dados: CadastroPeriodosEscolares
): Promise<PeriodoEscolarApi> => {
  const calendario = obterCalendario(dados.tipoCalendario);
  const quantidade = ehCalendarioAnual(calendario) ? 4 : 2;
  const ordenados = [...dados.periodos].sort((a, b) => a.bimestre - b.bimestre);
  if (
    ordenados.length !== quantidade ||
    ordenados.some((item, indice) => item.bimestre !== indice + 1)
  ) {
    rejeitar(`Informe os ${quantidade} bimestres do calendário.`);
  }
  const periodos = ordenados.map((item) => {
    const inicio = paraDia(item.periodoInicio);
    const fim = paraDia(item.periodoFim);
    if (!inicio || !fim)
      return rejeitar(
        `${item.bimestre}º Bimestre: informe as datas de início e fim.`
      );
    if (inicio.isAfter(fim, "day")) {
      rejeitar(
        `${item.bimestre}º Bimestre: a data de início não pode ser posterior à data de fim.`
      );
    }
    if (
      inicio.year() !== calendario.anoLetivo ||
      fim.year() !== calendario.anoLetivo
    ) {
      rejeitar(
        `${item.bimestre}º Bimestre: as datas devem pertencer ao ano do calendário (${calendario.anoLetivo}).`
      );
    }
    return {
      id: item.id || calendario.id * 10 + item.bimestre,
      bimestre: item.bimestre,
      periodoInicio: inicio.format("YYYY-MM-DD"),
      periodoFim: fim.format("YYYY-MM-DD"),
    };
  });
  for (let indice = 0; indice < periodos.length; indice++) {
    const atual = periodos[indice];
    for (const outro of periodos.slice(indice + 1)) {
      if (
        atual.periodoInicio <= outro.periodoFim &&
        outro.periodoInicio <= atual.periodoFim
      ) {
        rejeitar(
          `As datas do ${atual.bimestre}º e do ${outro.bimestre}º bimestres se sobrepõem.`
        );
      }
    }
    if (indice > 0 && atual.periodoInicio <= periodos[indice - 1].periodoFim) {
      rejeitar("Os bimestres devem seguir a ordem cronológica do calendário.");
    }
  }

  const referencia = periodosReferencia[calendario.id];
  const agora = new Date().toISOString();
  return {
    ...structuredClone(referencia || {}),
    tipoCalendario: calendario.id,
    anoBase: calendario.anoLetivo,
    periodos,
    criadoEm: referencia?.criadoEm || agora,
    criadoPor: referencia?.criadoPor || "Usuário de demonstração",
    criadoRF: referencia?.criadoRF || "0000000",
    ...(referencia
      ? {
          alteradoEm: agora,
          alteradoPor: "Usuário de demonstração",
          alteradoRF: "0000000",
        }
      : {}),
  };
};

export const periodoEscolarMock: FontePeriodosEscolares = {
  listarCalendarios: async (pesquisa = "") => {
    const texto = pesquisa.trim().toLocaleLowerCase("pt-BR");
    return structuredClone(
      calendarios.filter((item) =>
        item.descricao.toLocaleLowerCase("pt-BR").includes(texto)
      )
    );
  },
  obterPorTipoCalendario: async (id) => {
    const calendario = obterCalendario(id);
    return structuredClone(periodosReferencia[calendario.id] || null);
  },
  salvar,
};
