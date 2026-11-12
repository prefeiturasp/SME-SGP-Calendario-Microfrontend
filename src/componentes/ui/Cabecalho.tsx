import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo, type ReactNode } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../types/redux";

type ItemAjuda = { rota?: string; url?: string };

export const obterUrlAjuda = (lista: ItemAjuda[] | undefined, rotaAtiva?: string) => {
  if (!lista?.length || !rotaAtiva) return "";
  const dados = lista.find((item) => !!item?.rota && rotaAtiva.includes(item.rota));
  if (dados?.url && dados.rota && rotaAtiva.startsWith(dados.rota)) return dados.url;
  return "";
};

export const Cabecalho = ({
  pagina,
  children,
}: {
  pagina: string;
  children?: ReactNode;
}) => {
  const usuario = useSelector((state: RootState) => state.usuario);
  const rotaAtiva = useSelector((state: RootState) => state.navegacao?.rotaAtiva);
  const urlAjuda = useMemo(
    () => obterUrlAjuda(usuario?.listaUrlAjudaDoSistema, rotaAtiva || window.location.pathname),
    [usuario, rotaAtiva],
  );

  return (
      <header className="calendario-cabecalho">
        <h1 className="calendario-titulo">
          {pagina}
          {urlAjuda && (
            <button
              type="button"
              className="calendario-ajuda"
              aria-label="Ajuda"
              onClick={() => window.open(urlAjuda, "_blank")}
            >
              <FontAwesomeIcon icon={faQuestionCircle} className="" />
            </button>
          )}
        </h1>
        <div className="calendario-acoes">{children}</div>
      </header>
  );
};
