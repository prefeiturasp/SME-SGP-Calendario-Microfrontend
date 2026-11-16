import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Botao, BotaoExcluir, BotaoVoltar } from "../../../componentes/ui/Botao";
import { confirmar, exibirErrosApi, sucesso } from "../../../core/config/alertas";
import { ROTAS } from "../../../core/constantes";
import { useDestino, useRotaCalendario } from "../../../core/endereco";
import { definirBreadcrumbManual, verificaSomenteConsulta } from "../../../core/sessao";
import { eventoService } from "../../../services/eventoService";
import type { RootState } from "../../../types/redux";
import { useEventosCadastro, valoresIniciaisPadrao } from "./EventosCadastroContext";

const EventosCadastroBotoesAcao = () => {
  const navigate = useDestino();
  const { id: eventoId, tipoCalendarioId } = useRotaCalendario();
  const usuario = useSelector((state: RootState) => state.usuario);
  const permissoes = usuario.permissoes?.[ROTAS.EVENTOS];
  const {
    formRef,
    emEdicao,
    podeAlterarEvento,
    podeAlterarExcluir,
    somenteConsulta,
    setSomenteConsulta,
    desabilitarCampos,
    solicitarCancelar,
    setExibirLoader,
  } = useEventosCadastro();
  const novoRegistro = !eventoId;

  useEffect(() => {
    setSomenteConsulta(verificaSomenteConsulta(permissoes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissoes]);

  const urlLista = tipoCalendarioId ? `${ROTAS.EVENTOS}/${tipoCalendarioId}` : ROTAS.EVENTOS;

  const cancelar = async () => {
    if (!emEdicao) return;
    const confirmou = await confirmar(
      "Atenção",
      "Você não salvou as informações preenchidas.",
      "Deseja realmente cancelar as alterações?",
    );
    if (confirmou) solicitarCancelar();
  };

  const validarESalvar = async () => {
    const form = formRef.current;
    if (!form) return;
    Object.keys(valoresIniciaisPadrao).forEach((campo) => form.setFieldTouched(campo, true, false));
    const erros = await form.validateForm();
    if (Object.keys(erros).length === 0) await form.submitForm();
  };

  const voltar = async () => {
    if (!emEdicao) {
      if (tipoCalendarioId) {
        definirBreadcrumbManual(urlLista, "", ROTAS.EVENTOS);
      }
      navigate(urlLista);
      return;
    }
    const confirmou = await confirmar(
      "Atenção",
      "",
      "Suas alterações não foram salvas, deseja salvar agora?",
    );
    if (confirmou) await validarESalvar();
    else navigate(urlLista);
  };

  const excluir = async () => {
    if (novoRegistro || !eventoId) return;
    const confirmou = await confirmar(
      "Excluir evento",
      "",
      "Deseja realmente excluir este evento?",
      "Excluir",
      "Cancelar",
    );
    if (!confirmou) return;
    setExibirLoader(true);
    try {
      const resposta = await eventoService.deletar([Number(eventoId)]);
      if (resposta.status === 200) {
        sucesso("Evento excluído com sucesso");
        navigate(urlLista);
      }
    } catch (falha) {
      exibirErrosApi(falha, usuario.logado);
    } finally {
      setExibirLoader(false);
    }
  };

  const desabilitarCadastrar =
    desabilitarCampos ||
    somenteConsulta ||
    !permissoes?.podeAlterar ||
    (!podeAlterarExcluir && !novoRegistro) ||
    !podeAlterarEvento ||
    (!novoRegistro && !emEdicao);

  return (
    <>
      <BotaoVoltar onClick={() => void voltar()} />
      <Botao
        id="SGP_BUTTON_CANCELAR"
        label="Cancelar"
        disabled={!emEdicao || !podeAlterarEvento}
        onClick={() => void cancelar()}
      />
      {!novoRegistro && (
        <BotaoExcluir
          disabled={
            somenteConsulta ||
            !permissoes?.podeExcluir ||
            !podeAlterarEvento ||
            !podeAlterarExcluir
          }
          onClick={() => void excluir()}
        />
      )}
      <Botao
        id="SGP_BUTTON_ALTERAR_CADASTRAR"
        label={novoRegistro ? "Cadastrar" : "Alterar"}
        disabled={desabilitarCadastrar}
        onClick={() => void validarESalvar()}
      />
    </>
  );
};

export default EventosCadastroBotoesAcao;
