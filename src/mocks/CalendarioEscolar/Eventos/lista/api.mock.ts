import { dresMock } from "./dres.mock";
import { eventosMock } from "./eventos.mock";
import { tiposCalendarioMock } from "./tiposCalendario.mock";
import { tiposEventoMock } from "./tiposEvento.mock";
import { uesPorDreMock } from "./ues.mock";
import type { Evento, Paginado } from "./tipos";

let latenciaMs = 300; // dá tempo do Loader aparecer na gravação
export const configurarLatencia = (ms: number) => {
  latenciaMs = ms;
};

const clonar = <T>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T;

const esperar = <T>(valor: T) =>
  new Promise<{ data: T; status: 200 }>((resolver) => {
    setTimeout(() => resolver({ data: clonar(valor), status: 200 }), latenciaMs);
  });

const normalizar = (texto = "") =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export type FiltroEventos = {
  tipoCalendarioId?: number;
  dreId?: string;
  ueId?: string; // "" = Todas
  ehTodasDres?: boolean;
  ehTodasUes?: boolean;
  tipoEventoId?: string | number;
  nomeEvento?: string;
  dataInicio?: string; // "MM-DD-YYYY" (mesmo formato da API)
  dataFim?: string;
  ehEventosTodaRede?: boolean;
};

const deMMDDYYYY = (valor?: string) => {
  if (!valor) return null;
  const [mes, dia, ano] = valor.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
};

let eventosEmMemoria: Evento[] = [...eventosMock];

/** Restaura os dados originais (usado por testes; recarregar a página também restaura). */
export const restaurarEventos = () => {
  eventosEmMemoria = [...eventosMock];
};

/** Acesso do cadastro ao mesmo "banco" em memória da listagem. */
export const lerEventoEmMemoria = (id: number) => eventosEmMemoria.find((e) => e.id === id);

export const proximoIdEvento = () => Math.max(0, ...eventosEmMemoria.map((e) => e.id)) + 1;

export const gravarEventoEmMemoria = (evento: Evento) => {
  const existe = eventosEmMemoria.some((e) => e.id === evento.id);
  eventosEmMemoria = existe
    ? eventosEmMemoria.map((e) => (e.id === evento.id ? evento : e))
    : [...eventosEmMemoria, evento];
};

const filtrarEventos =(f: FiltroEventos) => {
  const inicio = deMMDDYYYY(f.dataInicio);
  const fim = deMMDDYYYY(f.dataFim);

  return eventosEmMemoria
    .filter((e) => e.tipoCalendarioId === f.tipoCalendarioId)
    .filter((e) => {
      if (f.ehTodasDres && f.ehTodasUes) return true; // SME: tudo do calendário
      if (f.ehTodasUes && f.dreId) return e.dreId === f.dreId || e.dreId === null;
      if (f.ueId) return e.ueId === f.ueId || e.dreId === null;
      return true; // sem recorte de abrangência
    })
    .filter((e) => !f.ehEventosTodaRede || (e.dreId === null && e.ueId === null))
    .filter((e) => !f.tipoEventoId || e.tipoEvento.id === Number(f.tipoEventoId))
    .filter((e) => !f.nomeEvento || normalizar(e.nome).includes(normalizar(f.nomeEvento)))
    .filter((e) => {
      // período: o intervalo do evento precisa sobrepor [inicio, fim]
      if (fim && new Date(e.dataInicio) > fim) return false;
      if (inicio && new Date(e.dataFim) < inicio) return false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime() || a.id - b.id,
    );
};

export const apiMock = {
  tiposCalendario: (descricao = "") =>
    esperar(
      tiposCalendarioMock.filter((c) =>
        normalizar(c.descricao).includes(normalizar(descricao)),
      ),
    ),
  dres: () => esperar([...dresMock]),
  ues: (codigoDre: string) => esperar([...(uesPorDreMock[codigoDre] ?? [])]),
  tiposEvento: () => esperar({ items: [...tiposEventoMock] }),
  eventos: (pagina: number, registros: number, filtro: FiltroEventos) => {
    const filtrados = filtrarEventos(filtro);
    const resposta: Paginado<Evento> = {
      items: filtrados.slice((pagina - 1) * registros, pagina * registros),
      totalRegistros: filtrados.length,
    };
    return esperar(resposta);
  },
  excluir: (ids: number[]) => {
    eventosEmMemoria = eventosEmMemoria.filter((e) => !ids.includes(e.id));
    return esperar(ids);
  },
};
