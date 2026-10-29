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
}: {
  form: Formulario;
  name: string;
  label: string;
  id?: string;
  desabilitado?: boolean;
  labelRequired?: boolean;
  onChange?: () => void;
}) => {
  const mensagem = form.touched[name] ? (form.errors[name] as string | undefined) : undefined;
  return (
    <div className={mensagem ? "campo-invalido" : undefined}>
      <label className="campo-label" htmlFor={id || name}>
        {label}
        {labelRequired && <span className="campo-obrigatorio">*</span>}
      </label>
      <Input.TextArea
        id={id || name}
        rows={3}
        disabled={desabilitado}
        value={String(form.values[name] ?? "")}
        onChange={(evento) => {
          form.setFieldValue(name, evento.target.value);
          form.setFieldTouched(name, true, false);
          onChange?.();
        }}
      />
      {mensagem && <div className="campo-erro">{mensagem}</div>}
    </div>
  );
};
