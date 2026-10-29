import { useLocation, useNavigate, useParams } from "react-router-dom";

export const lerParametros = (pathname: string) => {
  const editar = pathname.match(/\/editar\/([^/]+)/);
  const novo = pathname.match(/\/novo\/([^/]+)/);
  return {
    id: editar?.[1],
    tipoCalendarioId: novo?.[1],
  };
};

export const caminhoEfetivo = (pathnameDoRouter: string) => {
  if (typeof window !== "undefined" && resolverPeloEndereco(window.location.pathname)) {
    return window.location.pathname;
  }
  return pathnameDoRouter;
};

const resolverPeloEndereco = (pathname: string) => {
  return (
    pathname.includes("/calendario-escolar/periodos-escolares") ||
    pathname.includes("/calendario-escolar/periodo-fechamento-abertura") ||
    pathname.includes("/calendario-escolar/periodo-fechamento-reabertura")
  );
};

export const sincronizarEndereco = (destino: string) => {
  if (typeof window === "undefined") return;
  if (window.location.pathname === destino) return;
  window.history.pushState(null, "", destino);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export const useDestino = () => {
  const navigate = useNavigate();
  return (destino: string) => {
    navigate(destino);
    sincronizarEndereco(destino);
  };
};

export const useRotaCalendario = () => {
  const location = useLocation();
  const params = useParams();
  const caminho = caminhoEfetivo(location.pathname);
  const daUrl = lerParametros(caminho);
  return {
    caminho,
    id: params.id || daUrl.id,
    tipoCalendarioId: params.tipoCalendarioId || daUrl.tipoCalendarioId,
  };
};
