import { faArrowLeft, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "antd";
import type { ReactNode } from "react";

type BotaoProps = {
  id: string;
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  cor?: "roxo" | "azul" | "vermelho";
  icone?: ReactNode;
  titulo?: string;
};

export const Botao = ({
  id,
  label,
  onClick,
  disabled,
  cor = "roxo",
  icone,
  titulo,
}: BotaoProps) => {
  const botao = (
    <button
      type="button"
      id={id}
      className={`btn-acao btn-${cor}`}
      disabled={disabled}
      title={titulo}
      onClick={onClick}
    >
      {icone}
      {label}
    </button>
  );

  if (!titulo) return botao;
  return <Tooltip title={titulo}>{botao}</Tooltip>;
};

export const BotaoVoltar = ({ onClick }: { onClick: () => void }) => (
  <Botao
    id="SGP_BUTTON_VOLTAR"
    cor="azul"
    titulo="Voltar"
    onClick={onClick}
    icone={<FontAwesomeIcon icon={faArrowLeft} className="" />}
  />
);

export const BotaoExcluir = ({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) => (
  <Botao
    id="SGP_BUTTON_EXCLUIR"
    cor="vermelho"
    titulo="Excluir"
    disabled={disabled}
    onClick={onClick}
    icone={<FontAwesomeIcon icon={faTrashAlt} className="" />}
  />
);
