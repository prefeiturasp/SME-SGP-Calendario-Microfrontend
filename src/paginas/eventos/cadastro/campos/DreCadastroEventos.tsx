import type { FormikProps } from "formik";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { SelectCampo } from "../../../../componentes/ui/SelectCampo";
import { exibirErrosApi } from "../../../../core/config/alertas";
import { OPCAO_TODOS, comoLista } from "../../../../core/constantes";
import { ordenarPorNome, type Abrangencia } from "../../../../core/regras/reabertura";
import { eventoService } from "../../../../services/eventoService";
import type { RootState } from "../../../../types/redux";
import type { ValoresEvento } from "../EventosCadastroContext";

const DreCadastroEventos = ({
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
  const [lista, setLista] = useState<Abrangencia[]>([]);
  const [carregando, setCarregando] = useState(false);
  const { dreId } = form.values;
  // Na edição a lista só é montada depois que o evento trouxe a DRE.
  const pronto = !eventoId || !!dreId;
  const dreEhTodas = dreId === OPCAO_TODOS;

  useEffect(() => {
    if (!pronto) return;
    let ativo = true;
    setCarregando(true);
    eventoService
      .buscarDres()
      .then((resposta) => {
        if (!ativo) return;
        const dres = comoLista<Abrangencia>(resposta.data).sort(ordenarPorNome("nome"));
        if (dres.length === 1 && !eventoId) {
          form.setFieldValue("dreId", dres[0].codigo || "");
        }
        if (usuario.possuiPerfilSme && dres.length > 1) {
          dres.unshift({ codigo: OPCAO_TODOS, nome: "Todas" });
          if (!eventoId) form.setFieldValue("dreId", OPCAO_TODOS);
        } else if (eventoId && dreEhTodas) {
          dres.unshift({ codigo: OPCAO_TODOS, nome: "Todas" });
        }
        setLista(dres);
      })
      .catch((falha) => exibirErrosApi(falha, usuario.logado))
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, eventoId, usuario.possuiPerfilSme, usuario.logado]);

  return (
    <SelectCampo
      id="codigo-dre"
      label="Diretoria Regional de Educação (DRE)"
      labelRequired
      lista={lista}
      valueOption="codigo"
      valueText="nome"
      carregando={carregando}
      disabled={lista.length === 1 || desabilitar}
      value={form.values.dreId}
      placeholder="Selecione uma DRE"
      showSearch
      erro={form.touched.dreId ? form.errors.dreId : undefined}
      onChange={(valor) => {
        form.setFieldValue("dreId", String(valor));
        form.setFieldTouched("dreId", true, false);
        onChangeCampos();
      }}
    />
  );
};

export default DreCadastroEventos;
