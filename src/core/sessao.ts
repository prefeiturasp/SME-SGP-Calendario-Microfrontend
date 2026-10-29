import type { PermissoesTela } from "./constantes";

type Acao = { type: string; payload?: unknown };

let despachar: ((acao: Acao) => void) | null = null;

export const registrarDispatch = (dispatch: ((acao: Acao) => void) | null) => {
  despachar = dispatch;
};

const enviar = (acao: Acao) => {
  despachar?.(acao);
};

export const deslogarSessaoInvalida = () => {
  enviar({ type: "@filtro/limparDadosFiltro" });
  enviar({ type: "@usuario/deslogar" });
  enviar({ type: "@sessao/limpar" });
};

export const deslogarSessaoExpirada = () => {
  deslogarSessaoInvalida();
  enviar({ type: "@usuario/deslogarSessaoExpirou" });
};

export const definirSomenteConsulta = (valor: boolean) => {
  enviar({ type: "@navegacao/somenteConsulta", payload: valor });
};

export const definirBreadcrumbManual = (
  path: string,
  breadcrumbName: string,
  parent: string,
) => {
  enviar({
    type: "@navegacao/rotas",
    payload: { path, breadcrumbName, parent },
  });
  enviar({ type: "@navegacao/rotaAtiva", payload: path });
  localStorage.setItem(
    "rota-dinamica",
    `{"path":"${path}","breadcrumbName":"${breadcrumbName}", "parent": "${parent}" }`,
  );
};

export const verificaSomenteConsulta = (permissoes?: PermissoesTela | null) => {
  if (
    permissoes &&
    permissoes.podeConsultar &&
    !permissoes.podeAlterar &&
    !permissoes.podeIncluir &&
    !permissoes.podeExcluir
  ) {
    definirSomenteConsulta(true);
    return true;
  }
  definirSomenteConsulta(false);
  return false;
};
