import { apiMock, type FiltroEventos } from "../mocks/CalendarioEscolar/Eventos/lista";
import { apiCadastroMock, type PayloadEvento } from "../mocks/CalendarioEscolar/Eventos/cadastro";

// Nesta etapa tudo vem de mock. Na integração, cada função troca o corpo por
// getSgp/postSgp/putSgp/deleteSgp com a rota indicada no comentário.
export const eventoService = {
  // GET v1/calendarios/tipos/anos-letivos?descricao=
  obterTiposCalendario: (descricao = "") => apiMock.tiposCalendario(descricao),
  // GET /v1/abrangencias/{historico}/dres
  buscarDres: (_consideraHistorico = false) => apiMock.dres(),
  // GET /v1/abrangencias/{historico}/dres/{dre}/ues
  buscarUes: (dre: string, _consideraHistorico = false) => apiMock.ues(dre),
  // GET v1/calendarios/eventos/tipos/listar
  obterTiposEvento: () => apiMock.tiposEvento(),
  // GET v1/calendarios/eventos?numeroPagina=&numeroRegistros=
  listar: (pagina: number, registros: number, filtro: FiltroEventos) =>
    apiMock.eventos(pagina, registros, filtro),
  // DELETE v1/calendarios/eventos
  deletar: (ids: number[]) => apiMock.excluir(ids),

  // --- Cadastro ---
  // GET v1/calendarios/eventos/tipos/listar?ehCadastro=true&numeroRegistros=100
  obterTiposEventoCadastro: () => apiCadastroMock.tiposEvento(),
  // GET v1/calendarios/eventos/{id}
  obterPorId: (id: number | string) => apiCadastroMock.obterPorId(Number(id)),
  // POST v1/calendarios/eventos  |  PUT v1/calendarios/eventos/{id}
  salvar: (id: number | string, payload: PayloadEvento) =>
    apiCadastroMock.salvar(Number(id) || 0, payload),
  // GET v1/calendarios/tipos/{id}
  obterTipoCalendarioPorId: (id: number | string) => apiCadastroMock.tipoCalendarioPorId(Number(id)),
  // GET v1/calendarios/tipos/anos/letivos/{ano}
  obterTiposCalendarioPorAno: (ano: number) => apiCadastroMock.tiposCalendarioPorAno(ano),
  // GET v1/calendarios/tipos/{id}/bimestres
  obterBimestres: (tipoCalendarioId: number | string) =>
    apiCadastroMock.bimestres(Number(tipoCalendarioId)),
  // POST v1/calendarios/feriados/listar
  obterFeriados: () => apiCadastroMock.feriados(),
};
