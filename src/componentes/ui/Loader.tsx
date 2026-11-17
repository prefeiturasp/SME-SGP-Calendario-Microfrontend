import { Spin } from "antd";
import type { ReactNode } from "react";

export const Loader = ({
  loading,
  children,
}: {
  loading?: boolean;
  children: ReactNode;
}) => <Spin spinning={!!loading}>{children}</Spin>;
