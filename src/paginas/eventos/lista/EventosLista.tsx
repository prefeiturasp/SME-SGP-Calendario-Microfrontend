import { Cabecalho } from "../../../componentes/ui/Cabecalho";
import { Loader } from "../../../componentes/ui/Loader";
import AlertaCalendarioObrigatorio from "./AlertaCalendarioObrigatorio";
import EventosListaBotoesAcao from "./EventosListaBotoesAcao";
import { EventosListaProvider, useEventosLista } from "./EventosListaContext";
import EventosListaFiltros from "./EventosListaFiltros";
import EventosListaPaginada from "./EventosListaPaginada";

const Conteudo = () => {
  const { exibirLoader } = useEventosLista();
  return (
    <>
      <AlertaCalendarioObrigatorio />
      <Loader loading={exibirLoader}>
        <Cabecalho pagina="Eventos do calendário escolar (Micro frontend)">
          <EventosListaBotoesAcao />
        </Cabecalho>
        <section className="calendario-card">
          <EventosListaFiltros />
          <EventosListaPaginada />
        </section>
      </Loader>
    </>
  );
};

const EventosLista = () => (
  <EventosListaProvider>
    <Conteudo />
  </EventosListaProvider>
);

export default EventosLista;
