type Notificacao = (config: {
  message: string;
  description: string;
  duration: number;
  className: string;
}) => void;

type NotificacaoApi = {
  success: Notificacao;
  error: Notificacao;
  warning: Notificacao;
};

type ModalApi = {
  confirm: (config: {
    title: string;
    content: string;
    okText: string;
    cancelText: string;
    onOk: () => void;
    onCancel: () => void;
  }) => void;
};

let notificationApi: NotificacaoApi | null = null;
let modalApi: ModalApi | null = null;

export const setAntdNotification = (api: NotificacaoApi | null) => {
  notificationApi = api;
};

export const getAntdNotification = () => notificationApi;

export const setAntdModal = (api: ModalApi | null) => {
  modalApi = api;
};

export const getAntdModal = () => modalApi;
