import type { FormikProps } from "formik";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { SelectCampo } from "../../../../componentes/ui/SelectCampo";
import { exibirErrosApi } from "../../../../core/config/alertas";
import { OPCAO_TODOS, comoLista } from "../../../../core/constantes";
import type { Abrangencia } from "../../../../core/regras/reabertura";
import { eventoService } from "../../../../services/eventoService";
import type { RootState } from "../../../../types/redux";
import { useEventosCadastro, type ValoresEvento } from "../EventosCadastroContext";

const UeCadastroEventos = ({
  form,
  eventoId,
  desabilitar,
  onChangeCampos,
}: {
  form: FormikProps<ValoresEvento>;
  eventoId?: string;
  desabilitar: boolean;
  onChangeCampos: () => void;
}) => {
  const usuario = useSelector((state: RootState) => state.usuario);
  const { listaUes, setListaUes, listaCalendarios } = useEventosCadastro();
  const [carregando, setCarregando] = useState(false);
  const { dreId, tipoCalendarioId } = form.values;
  const calendarioCarregado = listaCalendarios.length > 0;

  useEffect(() => {
    if (!dreId) {
      form.setFieldValue("ueId", "");
      setListaUes([]);
      return;
    }
    if (!tipoCalendarioId || !calendarioCarregado) return;

    const ueTodos: Abrangencia = { nome: "Todas", codigo: OPCAO_TODOS };
    if (dreId === OPCAO_TODOS) {
      form.setFieldValue("ueId", OPCAO_TODOS);
      setListaUes([ueTodos]);
      return;
    }

    let ativo = true;
    setCarregando(true);
    eventoService
      .buscarUes(dreId)
      .then((resposta) => {
        if (!ativo) return;
        const ues = comoLista<Abrangencia>(resposta.data);
        if (!ues.length) {
          form.setFieldValue("ueId", "");
          setListaUes([]);
          return;
        }
        if (ues.length === 1) {
          form.setFieldValue("ueId", ues[0].codigo || "");
        }
        if (usuario.possuiPerfilSmeOuDre && ues.length > 1) {
          ues.unshift(ueTodos);
          if (!eventoId) form.setFieldValue("ueId", OPCAO_TODOS);
        }
        setListaUes(ues);
      })
      .catch((falha) => exibirErrosApi(falha, usuario.logado))
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dreId, tipoCalendarioId, calendarioCarregado, eventoId, usuario.possuiPerfilSmeOuDre]);

  return (
    <SelectCampo
      id="codigo-ue"
      label="Unidade Escolar (UE)"
      labelRequired
      lista={listaUes}
      valueOption="codigo"
      valueText="nome"
      carregando={carregando}
      disabled={!dreId || listaUes.length === 1 || desabilitar}
      value={form.values.ueId}
      placeholder="Selecione uma UE"
      showSearch
      erro={form.touched.ueId ? form.errors.ueId : undefined}
      onChange={(valor) => {
        form.setFieldValue("ueId", String(valor));
        form.setFieldTouched("ueId", true, false);
        onChangeCampos();
      }}
    />
  );
};

export default UeCadastroEventos;
