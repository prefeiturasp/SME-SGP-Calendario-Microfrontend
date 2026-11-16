import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal } from "antd";
import { useEffect, useState } from "react";
import { Botao } from "../../../componentes/ui/Botao";
import { SelectCampo } from "../../../componentes/ui/SelectCampo";
import { ROTAS } from "../../../core/constantes";
import { useDestino, useRotaCalendario } from "../../../core/endereco";
import { useEventosCadastro } from "./EventosCadastroContext";

const EventosModalCopiarEvento = () => {
  const navigate = useDestino();
  const { tipoCalendarioId } = useRotaCalendario();
  const {
    exibirModalCopiar,
    setExibirModalCopiar,
    listaCalendarioEscolar,
    calendariosParaCopiar,
    setCalendariosParaCopiar,
    setEmEdicao,
    mensagensCopiar,
    setMensagensCopiar,
  } = useEventosCadastro();
  const [selecao, setSelecao] = useState<string[]>(calendariosParaCopiar);

  // Ao abrir, a seleção parte do que já estava confirmado.
  useEffect(() => {
    if (exibirModalCopiar) setSelecao(calendariosParaCopiar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exibirModalCopiar]);

  const selecionar = () => {
    setCalendariosParaCopiar(selecao);
    setEmEdicao(true);
    setExibirModalCopiar(false);
  };

  const fecharRetorno = () => {
    setMensagensCopiar(null);
    navigate(tipoCalendarioId ? `${ROTAS.EVENTOS}/${tipoCalendarioId}` : ROTAS.EVENTOS);
  };

  return (
    <>
      <Modal
        open={exibirModalCopiar}
        title="Copiar evento"
        closable={false}
        maskClosable={false}
        keyboard={false}
        onCancel={() => setExibirModalCopiar(false)}
        footer={
          <div className="recorrencia-rodape">
            <Botao
              id="btn-copiar-cancelar"
              label="Cancelar"
              cor="azul"
              onClick={() => setExibirModalCopiar(false)}
            />
            <Botao id="btn-copiar-selecionar" label="Selecionar" onClick={selecionar} />
          </div>
        }
      >
        <SelectCampo
          id="copiar-evento-select"
          multiple
          lista={listaCalendarioEscolar}
          valueOption="id"
          valueText="descricaoTipoCalendario"
          value={selecao}
          placeholder="Selecione 1 ou mais tipos de calendários"
          onChange={(valores) => setSelecao(valores as string[])}
        />
      </Modal>

      <Modal
        open={!!mensagensCopiar}
        title="Cadastro de evento"
        closable={false}
        maskClosable={false}
        keyboard={false}
        onCancel={fecharRetorno}
        footer={<Botao id="btn-copiar-ok" label="Ok" cor="azul" onClick={fecharRetorno} />}
      >
        {(mensagensCopiar ?? []).map((item) => (
          <p key={item.mensagem}>
            <strong className={item.sucesso ? "retorno-sucesso" : "retorno-erro"}>
              <FontAwesomeIcon icon={item.sucesso ? faCheck : faTimes} className="" /> {item.mensagem}
            </strong>
          </p>
        ))}
      </Modal>
    </>
  );
};

export default EventosModalCopiarEvento;
