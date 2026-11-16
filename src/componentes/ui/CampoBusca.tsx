import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Input } from "antd";

export const CampoBusca = ({
  id,
  label,
  placeholder,
  value,
  desabilitado,
  onChange,
}: {
  id: string;
  label?: string;
  placeholder?: string;
  value?: string;
  desabilitado?: boolean;
  onChange: (valor: string) => void;
}) => (
  <div>
    {label && (
      <label className="campo-label" htmlFor={id}>
        {label}
      </label>
    )}
    <Input
      id={id}
      allowClear
      placeholder={placeholder}
      disabled={desabilitado}
      value={value}
      suffix={<FontAwesomeIcon icon={faSearch} className="" />}
      onChange={(evento) => onChange(evento.target.value)}
    />
  </div>
);
