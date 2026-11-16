import type { FormikProps } from "formik";
import { useEffect, useState } from "react";
import { SelectCampo } from "../../../../componentes/ui/SelectCampo";
import { comoLista } from "../../../../core/constantes";
import { onchangeMultiSelect } from "../../../../core/regras/reabertura";
import type { Bimestre } from "../../../../mocks/CalendarioEscolar/Eventos/cadastro";
import { eventoService } from "../../../../services/eventoService";
import type { ValoresEvento } from "../EventosCadastroContext";

const BimestreCadastroEventos = ({
  form,
  desabilitar,
  onChangeCampos,
}: {
  form: FormikProps<ValoresEvento>;
  desabilitar: boolean;
  onChangeCampos: () => void;
}) => {
  const [lista, setLista] = useState<{ valor: string; desc: string }[]>([]);
  const { tipoCalendarioId, bimestre } = form.values;

  useEffect(() => {
    if (!tipoCalendarioId) return;
    let ativo = true;
    eventoService
      .obterBimestres(tipoCalendarioId)
      .then((resposta) => {
        if (!ativo) return;
        setLista(
          comoLista<Bimestre>(resposta.data).map((item) => ({
            valor: String(item.valor),
            desc: item.desc,
          })),
        );
      })
      .catch(() => {
        if (ativo) setLista([]);
      });
    return () => {
      ativo = false;
    };
  }, [tipoCalendarioId]);

  return (
    <SelectCampo
      id="bimestre"
      label="Bimestre"
      multiple
      lista={lista}
      valueOption="valor"
      valueText="desc"
      value={bimestre}
      disabled={desabilitar}
      placeholder="Bimestre"
      onChange={(selecionados) => {
        onchangeMultiSelect((selecionados as string[]) || [], bimestre, (novos) => {
          form.setFieldValue("bimestre", novos);
          form.setFieldTouched("bimestre", true, false);
        });
        onChangeCampos();
      }}
    />
  );
};

export default BimestreCadastroEventos;
