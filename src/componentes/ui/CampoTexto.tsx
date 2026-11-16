import { Input } from "antd";
import type { FormikProps } from "formik";

type Formulario = FormikProps<Record<string, unknown>>;

export const CampoTexto = ({
  form,
  name,
  label,
  id,
  desabilitado,
  labelRequired,
  onChange,
  placeholder,
  tipo = "textarea",
}: {
  form: Formulario;
  name: string;
  label: string;
  id?: string;
  desabilitado?: boolean;
  labelRequired?: boolean;
  onChange?: () => void;
  placeholder?: string;
  /** "textarea" (padrão) ou "input" de uma linha. */
  tipo?: "textarea" | "input";
}) => {
  const mensagem = form.touched[name] ? (form.errors[name] as string | undefined) : undefined;
  const alterar = (evento: { target: { value: string } }) => {
    form.setFieldValue(name, evento.target.value);
    form.setFieldTouched(name, true, false);
    onChange?.();
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
          value={String(form.values[name] ?? "")}
          onChange={alterar}
        />
      ) : (
        <Input.TextArea
          id={id || name}
          rows={3}
          placeholder={placeholder}
          disabled={desabilitado}
          value={String(form.values[name] ?? "")}
          onChange={alterar}
        />
      )}
      {mensagem && <div className="campo-erro">{mensagem}</div>}
    </div>
  );
};
