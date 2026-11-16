import { Input } from "antd";
import type { FormikProps } from "formik";

export type TFormulario = FormikProps<Record<string, unknown>>;

type TCampoTextoProps = {
  form: TFormulario;
  name: string;
  label: string;
  id?: string;
  maxlength?: number;
  placeholder?: string;
  desabilitado?: boolean;
  labelRequired?: boolean;
  onChange?: (textValue: string) => void;
  rows?: number;
}


export const CampoTexto = ({
  form,
  name,
  label,
  id,
  desabilitado,
  labelRequired,
  onChange,
  maxlength,
  placeholder,
  rows = 3,
}: TCampoTextoProps) => {
  const mensagem = form.touched[name] ? (form.errors[name] as string | undefined) : undefined;
  return (
    <div className={mensagem ? "campo-invalido" : undefined}>
      <label className="campo-label" htmlFor={id || name}>
        {label}
        {labelRequired && <span className="campo-obrigatorio">*</span>}
      </label>
      <Input.TextArea
        id={id || name}
        rows={rows}
        disabled={desabilitado}
        value={String(form.values[name] ?? "")}
        onChange={(evento) => {
          form.setFieldValue(name, evento.target.value);
          form.setFieldTouched(name, true, false);
          onChange?.(evento.target.value);
        }}
        placeholder={placeholder}
        maxLength={maxlength}
        style={{ resize: "none" }}
      />
      {mensagem && <div className="campo-erro">{mensagem}</div>}
    </div>
  );
};
