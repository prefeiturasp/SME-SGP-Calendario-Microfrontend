import { DatePicker } from "antd";
import type { Dayjs } from "dayjs";

export const CampoDataFiltro = ({
  id,
  label,
  placeholder = "DD/MM/YYYY",
  valor,
  desabilitado,
  erro,
  onChange,
}: {
  id: string;
  label?: string;
  placeholder?: string;
  valor?: Dayjs | null;
  desabilitado?: boolean;
  erro?: string;
  onChange: (data: Dayjs | null) => void;
}) => (
  <div className={erro ? "campo-invalido" : undefined}>
    {label && (
      <label className="campo-label" htmlFor={id}>
        {label}
      </label>
    )}
    <DatePicker
      id={id}
      format="DD/MM/YYYY"
      placeholder={placeholder}
      disabled={desabilitado}
      value={valor ?? null}
      style={{ width: "100%" }}
      showToday={false}
      onChange={(data) => onChange(data)}
    />
    {erro && <div className="campo-erro">{erro}</div>}
  </div>
);
