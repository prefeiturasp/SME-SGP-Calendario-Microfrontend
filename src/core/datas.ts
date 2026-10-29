import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/pt-br";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.locale("pt-br");

export type ValorData = Dayjs | string | Date | null | undefined;

export const paraDia = (valor: unknown): Dayjs | null => {
  if (!valor) return null;
  if (dayjs.isDayjs(valor)) return valor.isValid() ? valor : null;
  if (valor instanceof Date || typeof valor === "string" || typeof valor === "number") {
    const data = dayjs(valor);
    return data.isValid() ? data : null;
  }
  if (
    typeof valor === "object" &&
    "toDate" in valor &&
    typeof valor.toDate === "function"
  ) {
    const data = dayjs((valor.toDate as () => Date)());
    return data.isValid() ? data : null;
  }
  return null;
};

export const paraDataApi = (valor: ValorData): Date | null => {
  const dia = paraDia(valor);
  return dia ? dia.toDate() : null;
};

export const formatarDia = (valor: ValorData, formato = "DD/MM/YYYY") => {
  const dia = paraDia(valor);
  return dia ? dia.format(formato) : "";
};

export const formatarUtc = (valor: ValorData) => {
  if (!valor) return null;
  const dia = dayjs.utc(valor as string | Date);
  return dia.isValid() ? dia : null;
};

export const diasEntre = (inicio: ValorData, fim: ValorData) => {
  const diaInicial = paraDia(inicio);
  const diaFinal = paraDia(fim);
  if (!diaInicial || !diaFinal) return [];

  const dias: string[] = [];
  let cursor = diaInicial.startOf("day");
  const limite = diaFinal.startOf("day");
  while (cursor.isBefore(limite) || cursor.isSame(limite, "day")) {
    dias.push(cursor.format("YYYY-MM-DD"));
    cursor = cursor.add(1, "day");
  }
  return dias;
};

export const inicioNaoAnterior = (dataInicial: ValorData, dataFinal: ValorData) => {
  const inicio = paraDia(dataInicial);
  const fim = paraDia(dataFinal);
  if (!inicio || !fim) return false;
  return !inicio.isBefore(fim, "day");
};

export const inicioPosterior = (dataInicial: ValorData, dataFinal: ValorData) => {
  const inicio = paraDia(dataInicial);
  const fim = paraDia(dataFinal);
  if (!inicio || !fim) return false;
  return inicio.isAfter(fim, "day");
};

export { dayjs };
