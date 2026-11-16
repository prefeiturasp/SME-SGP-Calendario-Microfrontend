import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Botao, BotaoExcluir, BotaoVoltar } from "../../../componentes/ui/Botao";
import { confirmar, exibirErrosApi, sucesso } from "../../../core/config/alertas";
import { ROTAS, URL_HOME } from "../../../core/constantes";
import { useDestino } from "../../../core/endereco";
import { verificaSomenteConsulta } from "../../../core/sessao";
import { eventoService } from "../../../services/eventoService";
import type { RootState } from "../../../types/redux";
import { useEventosLista } from "./EventosListaContext";

const EventosListaBotoesAcao = () => {
  const navigate = useDestino();
  const usuario = useSelector((state: RootState) => state.usuario);
  const permissoes = usuario.permissoes?.[ROTAS.EVENTOS];
  const {
    eventosSelecionados,
    setEventosSelecionados,
    calendarioSelecionado,
    recarregarLista,
    setExibirLoader,
  } = useEventosLista();
  const [somenteConsulta, setSomenteConsulta] = useState(false);

  useEffect(() => {
    setSomenteConsulta(verificaSomenteConsulta(permissoes));
  }, [permissoes]);

  // Basta um evento selecionado que o usuário possa alterar/excluir.
  const podeAlterarExcluir = useMemo(
    () =>
      eventosSelecionados.some(
        (item) =>
          usuario.possuiPerfilSme ||
          (usuario.possuiPerfilDre && item.dreId && item.ueId) ||
          item.criadoRF === usuario.rf,
      ),
    [eventosSelecionados, usuario],
  );

  const excluir = async () => {
    if (!eventosSelecionados.length) return;
    const varios = eventosSelecionados.length > 1;
    const confirmou = await confirmar(
      "Excluir evento",
      eventosSelecionados.map((item) => String(item.nome)).join(", "),
      `Deseja realmente excluir ${varios ? "estes eventos" : "este evento"}?`,
      "Excluir",
      "Cancelar",
    );
    if (!confirmou) return;

    setExibirLoader(true);
    try {
      const resposta = await eventoService.deletar(
        eventosSelecionados.map((item) => item.id as number),
      );
      if (resposta.status === 200) {
        sucesso(`${varios ? "Eventos excluídos" : "Evento excluído"} com sucesso.`);
        setEventosSelecionados([]);
        recarregarLista();
      }
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
    } finally {
      setExibirLoader(false);
    }
  };

  return (
    <>
      <BotaoVoltar onClick={() => navigate(URL_HOME)} />
      <BotaoExcluir
        disabled={
          !permissoes?.podeExcluir ||
          !calendarioSelecionado?.id ||
          !eventosSelecionados.length ||
          !podeAlterarExcluir
        }
        onClick={() => void excluir()}
      />
      <Botao
        id="SGP_BUTTON_NOVO"
        label="Novo"
        disabled={somenteConsulta || !permissoes?.podeIncluir || !calendarioSelecionado?.id}
        onClick={() => navigate(`${ROTAS.EVENTOS}/novo/${calendarioSelecionado?.id}`)}
      />
    </>
  );
};

export default EventosListaBotoesAcao;
