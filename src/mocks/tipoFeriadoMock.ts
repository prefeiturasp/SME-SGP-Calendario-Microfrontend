import type {
  AbrangenciaFeriado,
  ConsultaTiposFeriado,
  PaginaTiposFeriado,
  TipoFeriado,
} from "../core/tipoFeriado";

type RegistroMock = {
  id: number;
  nome: string;
  abrangencia: AbrangenciaFeriado;
  tipo: TipoFeriado;
};

// Dados das referências visuais, sem representar um calendário legal vigente.
const registrosReferencia: ReadonlyArray<Readonly<RegistroMock>> = [
  { id: 1, nome: "Confraternização universal", abrangencia: 1, tipo: 1 },
  { id: 2, nome: "Aniversário de São Paulo", abrangencia: 3, tipo: 1 },
  { id: 3, nome: "Tiradentes", abrangencia: 1, tipo: 1 },
  { id: 4, nome: "Dia do trabalhador", abrangencia: 1, tipo: 1 },
  { id: 5, nome: "Revolução constitucionalista", abrangencia: 2, tipo: 1 },
  { id: 6, nome: "Independência", abrangencia: 1, tipo: 1 },
  { id: 7, nome: "Nossa Senhora Aparecida", abrangencia: 1, tipo: 1 },
  { id: 8, nome: "Finados", abrangencia: 1, tipo: 1 },
  { id: 9, nome: "Proclamação da república", abrangencia: 1, tipo: 1 },
  { id: 10, nome: "Consciência Negra (Municipal)", abrangencia: 3, tipo: 1 },
];

const abrangencias = [1, 2, 3] as const;
const complementos: ReadonlyArray<Readonly<RegistroMock>> = Array.from(
  { length: 30 },
  (_, indice) => ({
    id: indice + 11,
    nome: `Feriado de demonstração ${indice + 11}`,
    abrangencia: abrangencias[indice % abrangencias.length],
    tipo: indice % 2 === 0 ? 2 : 1,
  })
);

const registros = [...registrosReferencia, ...complementos];
const descricoesAbrangencia = { 1: "Nacional", 2: "Estadual", 3: "Municipal" };
const descricoesTipo = { 1: "Fixo", 2: "Móvel" };

export const listarTiposFeriadoMock = async (
  consulta: ConsultaTiposFeriado
): Promise<PaginaTiposFeriado> => {
  const nome = consulta.nome.trim().toLocaleLowerCase("pt-BR");
  const filtrados = registros.filter(
    (item) =>
      (!consulta.abrangencia || item.abrangencia === consulta.abrangencia) &&
      (!consulta.tipo || item.tipo === consulta.tipo) &&
      item.nome.toLocaleLowerCase("pt-BR").includes(nome)
  );
  const inicio = (consulta.pagina - 1) * consulta.tamanhoPagina;

  return {
    total: filtrados.length,
    itens: filtrados.slice(inicio, inicio + consulta.tamanhoPagina).map((item) => ({
      id: item.id,
      nome: item.nome,
      descricaoAbrangencia: descricoesAbrangencia[item.abrangencia],
      descricaoTipo: descricoesTipo[item.tipo],
    })),
  };
};
