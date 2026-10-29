import { useEffect, useState } from "react";
import { formatarUtc } from "../../core/datas";

const textoData = (valor: string | undefined, rf?: string, autor?: string, prefixo?: string) => {
  if (!autor) return "";
  const dia = valor ? formatarUtc(valor) : null;
  const registro = rf && rf !== "0" ? ` (${rf})` : "";
  const quando = dia ? ` em ${dia.format("DD/MM/YYYY")} às ${dia.format("HH:mm")}` : "";
  return `${prefixo} por ${autor}${registro}${quando}`;
};

export const Auditoria = ({
  criadoEm,
  criadoPor,
  criadoRf,
  alteradoEm,
  alteradoPor,
  alteradoRf,
}: {
  criadoEm?: string;
  criadoPor?: string;
  criadoRf?: string;
  alteradoEm?: string;
  alteradoPor?: string;
  alteradoRf?: string;
}) => {
  const [criado, setCriado] = useState(criadoEm);
  const [alterado, setAlterado] = useState(alteradoEm);

  useEffect(() => {
    if (criadoEm) setCriado(criadoEm);
  }, [criadoEm]);

  useEffect(() => {
    if (alteradoEm) setAlterado(alteradoEm);
  }, [alteradoEm]);

  return (
    <div className="auditoria">
      {criadoPor && <div>{textoData(criado, criadoRf, criadoPor, "INSERIDO")}</div>}
      {alteradoPor && <div>{textoData(alterado, alteradoRf, alteradoPor, "ALTERADO")}</div>}
    </div>
  );
};
