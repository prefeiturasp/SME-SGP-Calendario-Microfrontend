import { DatePicker } from "antd";
import type { FormikProps } from "formik";
import { paraDia, type ValorData } from "../../core/datas";

type Formulario = FormikProps<Record<string, unknown>>;

export const CampoData = ({
  form,
  name,
  label,
  placeholder = "DD/MM/YYYY",
  desabilitado,
  labelRequired,
  onChange,
  diasParaHabilitar,
}: {
  form: Formulario;
  name: string;
  label?: string;
  placeholder?: string;
  desabilitado?: boolean;
  labelRequired?: boolean;
  onChange?: () => void;
  diasParaHabilitar?: string[] | null;
}) => {
  const valor = paraDia(form.values[name] as ValorData);
  const mensagem = form.touched[name] ? (form.errors[name] as string | undefined) : undefined;

  return (
    <div className={mensagem ? "campo-invalido" : undefined}>
      {label && (
        <label className="campo-label" htmlFor={name}>
          {label}
          {labelRequired && <span className="campo-obrigatorio">*</span>}
        </label>
      )}
      <DatePicker
        id={name}
        name={name}
        format="DD/MM/YYYY"
        placeholder={placeholder}
        disabled={desabilitado}
        value={valor}
        style={{ width: "100%" }}
        showToday={false}
        disabledDate={(dataAtual) => {
          if (!diasParaHabilitar?.length) return false;
          return !diasParaHabilitar.includes(dataAtual.format("YYYY-MM-DD"));
        }}
        onChange={(data) => {
          form.setFieldValue(name, data || "");
          form.setFieldTouched(name, true, false);
          onChange?.();
        }}
      />
      {mensagem && <div className="campo-erro">{mensagem}</div>}
    </div>
  );
};
