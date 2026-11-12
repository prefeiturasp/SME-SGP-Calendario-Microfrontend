import { useEffect, type ReactNode } from "react";
import { ConfigProvider, Modal, notification } from "antd";
import ptBR from "antd/locale/pt_BR";
import { setAntdModal, setAntdNotification } from "./antd-static-api";

export const AntdAppProvider = ({ children }: { children: ReactNode }) => {
  const [notificationApi, notificationHolder] = notification.useNotification({
    maxCount: 5,
    placement: "topRight",
  });
  const [modalApi, modalHolder] = Modal.useModal();

  useEffect(() => {
    setAntdNotification(notificationApi as never);
    setAntdModal(modalApi as never);
    return () => {
      setAntdNotification(null);
      setAntdModal(null);
    };
  }, [notificationApi, modalApi]);

  return (
    <ConfigProvider locale={ptBR}>
      {notificationHolder}
      {modalHolder}
      {children}
    </ConfigProvider>
  );
};
