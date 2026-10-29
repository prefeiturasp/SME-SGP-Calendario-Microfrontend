import { Select, Spin } from "antd";

type Opcao = Record<string, unknown>;

export const SelectCampo = ({
  id,
  label,
  placeholder,
  lista,
  valueOption,
  valueText,
  value,
  disabled,
  carregando,
  labelRequired,
  multiple,
  showSearch,
  erro,
  onChange,
}: {
  id: string;
  label?: string;
  placeholder?: string;
  lista: Opcao[];
  valueOption: string;
  valueText: string;
  value?: string | string[];
  disabled?: boolean;
  carregando?: boolean;
  labelRequired?: boolean;
  multiple?: boolean;
  showSearch?: boolean;
  erro?: string;
  onChange: (valor: string | string[]) => void;
}) => (
  <div className={erro ? "campo-invalido" : undefined}>
    {label && (
      <label className="campo-label" htmlFor={id}>
        {label}
        {labelRequired && <span className="campo-obrigatorio">*</span>}
      </label>
    )}
    <Spin spinning={!!carregando}>
      <Select
        id={id}
        style={{ width: "100%" }}
        placeholder={placeholder}
        disabled={disabled}
        mode={multiple ? "multiple" : undefined}
        showSearch={showSearch}
        optionFilterProp="label"
        value={value || undefined}
        options={lista.map((item) => ({
          value: String(item[valueOption] ?? ""),
          label: String(item[valueText] ?? ""),
        }))}
        onChange={(selecionado) => onChange(selecionado as string | string[])}
      />
    </Spin>
    {erro && <div className="campo-erro">{erro}</div>}
  </div>
);
