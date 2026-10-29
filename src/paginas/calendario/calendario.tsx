import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { definirUrlApiSgp } from "../../config";
import { AntdAppProvider } from "../../core/config/antd-app-provider";
import { caminhoEfetivo } from "../../core/endereco";
import { resolverTela } from "../../core/rotas";
import { registrarDispatch } from "../../core/sessao";
import { definirSessaoApi } from "../../core/servico/apiSgp";
import PeriodoFechamentoAbertura from "../periodo-fechamento-abertura/PeriodoFechamentoAbertura";
import ReaberturaCadastro from "../periodo-fechamento-reabertura/ReaberturaCadastro";
import ReaberturaLista from "../periodo-fechamento-reabertura/ReaberturaLista";
import PeriodosEscolares from "../periodos-escolares/PeriodosEscolares";
import type { RootState } from "../../types/redux";
import "../../estilos.css";

export type CalendarioProps = {
  apiUrl?: string;
};

const Calendario = ({ apiUrl }: CalendarioProps) => {
  const dispatch = useDispatch();
  const usuario = useSelector((state: RootState) => state.usuario);
  const location = useLocation();
  const [versaoEndereco, setVersaoEndereco] = useState(0);

  useEffect(() => {
    const atualizar = () => setVersaoEndereco((valor) => valor + 1);
    window.addEventListener("popstate", atualizar);
    return () => window.removeEventListener("popstate", atualizar);
  }, []);

  if (apiUrl) definirUrlApiSgp(apiUrl);
  definirSessaoApi({
    token: usuario?.token,
    logado: usuario?.logado,
    dataHoraExpiracao: usuario?.dataHoraExpiracao,
  });
  registrarDispatch(dispatch);

  const tela = resolverTela(caminhoEfetivo(location.pathname));
  void versaoEndereco;

  return (
    <AntdAppProvider>
      <div className="calendario-pagina">
        {tela === "periodos-escolares" && (
          <PeriodosEscolares key={`periodos-${versaoEndereco}`} />
        )}
        {tela === "periodo-fechamento-abertura" && (
          <PeriodoFechamentoAbertura key={`abertura-${versaoEndereco}`} />
        )}
        {tela === "periodo-fechamento-reabertura" && (
          <ReaberturaLista key={`reabertura-${versaoEndereco}`} />
        )}
        {tela === "periodo-fechamento-reabertura-cadastro" && (
          <ReaberturaCadastro key={`cadastro-${versaoEndereco}`} />
        )}
        {!tela && <p>Tela de calendário não encontrada para esta rota.</p>}
      </div>
    </AntdAppProvider>
  );
};

export default Calendario;
