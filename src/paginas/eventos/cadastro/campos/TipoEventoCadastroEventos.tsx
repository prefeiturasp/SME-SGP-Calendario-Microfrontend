import type { FormikProps } from "formik";
import { useEffect } from "react";
import { SelectCampo } from "../../../../componentes/ui/SelectCampo";
import { LocalOcorrencia, OPCAO_TODOS, TipoEventoId } from "../../../../core/constantes";
import type { TipoEventoCadastro } from "../../../../mocks/CalendarioEscolar/Eventos/cadastro";
import { useEventosCadastro, type ValoresEvento } from "../EventosCadastroContext";

const { UE, DRE, SME, SMEUE, TODOS } = LocalOcorrencia;

/** Tipos de evento permitidos conforme o recorte DRE/UE escolhido. */
export const filtrarTiposPorAbrangencia = (
  origem: TipoEventoCadastro[],
  dreId: string,
  ueId: string,
) => {
  const dreTodas = dreId === OPCAO_TODOS;
  const ueTodas = ueId === OPCAO_TODOS;
  const locais: number[] =
    dreTodas && ueTodas
      ? [SME, SMEUE, TODOS]
      : !dreTodas && !ueTodas
        ? [UE, SMEUE, TODOS]
        : !dreTodas && ueTodas
          ? [DRE, TODOS]
          : [];
  return origem.filter((tipo) => locais.includes(tipo.localOcorrencia));
};

const TipoEventoCadastroEventos = ({
  form,
  desabilitar,
  onChangeCampos,
}: {
  form: FormikProps<ValoresEvento>;
  desabilitar: boolean;
  onChangeCampos: (tipoEventoId: string) => void;
}) => {
  const {
    listaTipoEvento,
    setListaTipoEvento,
    listaTipoEventoOrigem,
    setDesabilitarLetivo,
  } = useEventosCadastro();
  const { dreId, ueId, tipoEventoId } = form.values;

  useEffect(() => {
    if (dreId && ueId) {
      setListaTipoEvento(filtrarTiposPorAbrangencia(listaTipoEventoOrigem, dreId, ueId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dreId, ueId, listaTipoEventoOrigem]);

  // Um único tipo possível: já vem selecionado.
  useEffect(() => {
    if (listaTipoEvento.length === 1 && ueId) {
      form.setFieldValue("tipoEventoId", String(listaTipoEvento[0].id));
      if (listaTipoEvento[0].id === TipoEventoId.ItineranciaPAAI) {
        setDesabilitarLetivo(true);
        form.setFieldValue("letivo", 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaTipoEvento, ueId]);

  useEffect(() => {
    if (!tipoEventoId) {
      form.setFieldValue("feriadoId", "");
      form.setFieldValue("bimestre", []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoEventoId]);

  return (
    <SelectCampo
      id="tipo-evento"
      label="Tipo evento"
      labelRequired
      lista={listaTipoEvento}
      valueOption="id"
      valueText="descricao"
      disabled={listaTipoEvento.length === 1 || desabilitar}
      value={form.values.tipoEventoId}
      placeholder="Selecione um tipo"
      erro={form.touched.tipoEventoId ? form.errors.tipoEventoId : undefined}
      onChange={(valor) => {
        form.setFieldValue("tipoEventoId", String(valor));
        form.setFieldTouched("tipoEventoId", true, false);
        onChangeCampos(String(valor));
      }}
    />
  );
};

export default TipoEventoCadastroEventos;
