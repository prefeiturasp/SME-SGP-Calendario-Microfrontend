import { Input } from "antd";
import type { FormikProps } from "formik";
import { textoDoCampo } from "../../core/utils";

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
  tipo?: "textarea" | "input";
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
  tipo = "textarea",
}: TCampoTextoProps) => {
  const mensagem = form.touched[name] ? (form.errors[name] as string | undefined) : undefined;
  const valor = textoDoCampo(form.values[name]);
  
  const alterar = (evento: { target: { value: string } }) => {
    void form.setFieldValue(name, evento.target.value);
    void form.setFieldTouched(name, true, false);
    onChange?.(evento.target.value);
  };

  
  return (
    <div className={mensagem ? "campo-invalido" : undefined}>
      <label className="campo-label" htmlFor={id || name}>
        {label}
        {labelRequired && <span className="campo-obrigatorio">*</span>}
      </label>
      {tipo === "input" ? (
        <Input
          id={id || name}
          placeholder={placeholder}
          disabled={desabilitado}
           maxLength={maxlength}
          value={valor}
          onChange={alterar}
        />
      ) : (
        <Input.TextArea
        id={id || name}
        rows={rows}
        disabled={desabilitado}
        value={valor}
        onChange={alterar}
        placeholder={placeholder}
        maxLength={maxlength}
        style={{ resize: "none" }}
      />
      )}
      {mensagem && <div className="campo-erro">{mensagem}</div>}
    </div>
  );
};
