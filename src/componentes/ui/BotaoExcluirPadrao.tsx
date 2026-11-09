import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "antd";
import { Botao } from "./Botao";

type BotaoExcluirPadraoProps = {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  id?: string;
};

const BotaoExcluirPadrao = ({
  onClick = () => {},
  disabled = false,
  className = "",
  id = "SGP_BUTTON_EXCLUIR",
}: BotaoExcluirPadraoProps) => (
  <Tooltip
    title="Excluir"
    placement="bottom"
    mouseEnterDelay={0}
    getTooltipContainer={(trigger) => trigger.parentElement ?? document.body}
    className={className}
  >
    <span>
      <Botao
        id={id}
        disabled={disabled}
        cor="vermelho"
        onClick={onClick}
        icone={<FontAwesomeIcon icon={faTrashAlt} className="" />}
      />
    </span>
  </Tooltip>
);

export default BotaoExcluirPadrao;
