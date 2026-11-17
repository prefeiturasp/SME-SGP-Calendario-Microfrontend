import { Alert } from "antd";
import { useEventosLista } from "./EventosListaContext";

const AlertaCalendarioObrigatorio = () => {
  const { calendarioSelecionado } = useEventosLista();

  if (calendarioSelecionado?.id) return null;

  return (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: 16 }}
      message="Para cadastrar ou listar eventos você precisa selecionar um tipo de calendário"
    />
  );
};

export default AlertaCalendarioObrigatorio;
