import { AutoComplete, Spin } from "antd";

export const SelectAutocomplete = ({
  id,
  label,
  placeholder,
  lista,
  value,
  disabled,
  carregando,
  labelRequired,
  temErro,
  mensagemErro,
  onSelect,
  onChange,
  handleSearch,
}: {
  id: string;
  label?: string;
  placeholder?: string;
  lista: { id?: number | string; descricao: string }[];
  value?: string;
  disabled?: boolean;
  carregando?: boolean;
  labelRequired?: boolean;
  temErro?: boolean;
  mensagemErro?: string;
  onSelect?: (descricao: string) => void;
  onChange?: (descricao: string) => void;
  handleSearch?: (descricao: string) => void;
}) => (
  <div className={temErro ? "campo-invalido" : undefined}>
    {label && (
      <label className="campo-label" htmlFor={id}>
        {label}
        {labelRequired && <span className="campo-obrigatorio">*</span>}
      </label>
    )}
    <Spin spinning={!!carregando}>
      <AutoComplete
        id={id}
        style={{ width: "100%" }}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        options={(Array.isArray(lista) ? lista : []).map((item) => ({
          value: item.descricao,
          label: item.descricao,
        }))}
        onSelect={(selecionado) => onSelect?.(String(selecionado))}
        onChange={(texto) => {
          const descricao = String(texto ?? "");
          onChange?.(descricao);
          handleSearch?.(descricao);
        }}
        filterOption={false}
      />
    </Spin>
    {temErro && mensagemErro && <div className="campo-erro">{mensagemErro}</div>}
  </div>
);
