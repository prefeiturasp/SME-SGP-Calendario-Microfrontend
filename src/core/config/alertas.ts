import { Modal, notification } from "antd";
import { getAntdModal, getAntdNotification } from "./antd-static-api";

const exibirAlerta = (tipo: "success" | "error" | "warning", mensagem: string) => {
  const titulos = {
    success: "Sucesso",
    error: "Erro",
    warning: "Aviso",
  };
  const classes = {
    success: "sucesso",
    error: "erro",
    warning: "aviso",
  };
  const config = {
    message: titulos[tipo],
    description: mensagem,
    duration: 6,
    className: `alerta-${classes[tipo]}`,
  };
  const api = getAntdNotification();
  if (api?.[tipo]) {
    api[tipo](config);
    return;
  }
  notification[tipo](config);
};

export const sucesso = (mensagem: string) => exibirAlerta("success", mensagem);

export const erro = (mensagem: string) => exibirAlerta("error", mensagem);

export const mensagemApi = (dados: unknown, padrao: string) =>
  typeof dados === "string" && dados.trim() ? dados : padrao;

export const exibirErrosApi = (falha: unknown, logado = true) => {
  const cancelado = falha as { message?: string };
  if (!logado || cancelado?.message === "tokenExpirado") return;

  const resposta = falha as {
    response?: { data?: { mensagens?: string[] } };
  };
  const mensagens = resposta.response?.data?.mensagens;
  if (mensagens?.length) {
    mensagens.forEach((mensagem) => erro(mensagem));
    return;
  }
  erro("Ocorreu um erro interno.");
};

export const confirmar = (
  titulo: string,
  texto = "",
  textoNegrito = "",
  textoOk?: string,
  textoCancelar?: string,
) => {
  const conteudo = [texto, textoNegrito].filter(Boolean).join(" ");
  return new Promise<boolean>((resolve) => {
    const config = {
      title: titulo,
      content: conteudo,
      okText: textoOk || "Confirmar",
      cancelText: textoCancelar || "Cancelar",
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    };
    const modalApi = getAntdModal();
    if (modalApi?.confirm) {
      modalApi.confirm(config);
      return;
    }
    Modal.confirm(config);
  });
};
