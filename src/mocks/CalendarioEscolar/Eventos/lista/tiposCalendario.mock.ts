import type { TipoCalendario } from "../../../../core/constantes";

// Calendário 1 concentra a massa de eventos; 2 e 4 têm poucos; 3 não tem nenhum.
export const tiposCalendarioMock: TipoCalendario[] = [
  {
    id: 1,
    descricao: "2025 - EFM - CALENDÁRIO DE ATIVIDADES - ENS FUND E MEDIO",
    anoLetivo: 2025,
    modalidade: 1,
    periodo: 1,
  },
  {
    id: 2,
    descricao: "2025 - EJA - CALENDÁRIO DE ATIVIDADES - EJA",
    anoLetivo: 2025,
    modalidade: 2,
    periodo: 2,
  },
  {
    id: 3,
    descricao: "2025 - EI - CALENDÁRIO DE ATIVIDADES - EDUC INFANTIL",
    anoLetivo: 2025,
    modalidade: 3,
    periodo: 1,
  },
  {
    id: 4,
    descricao: "2024 - EFM - CALENDÁRIO DE ATIVIDADES - ENS FUND E MEDIO",
    anoLetivo: 2024,
    modalidade: 1,
    periodo: 1,
  },
];
