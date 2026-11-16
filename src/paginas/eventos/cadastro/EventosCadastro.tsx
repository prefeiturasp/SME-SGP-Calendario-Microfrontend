import { Cabecalho } from "../../../componentes/ui/Cabecalho";
import { Loader } from "../../../componentes/ui/Loader";
import EventosCadastroBotoesAcao from "./EventosCadastroBotoesAcao";
import { EventosCadastroProvider, useEventosCadastro } from "./EventosCadastroContext";
import EventosCadastroForm from "./EventosCadastroForm";

const Conteudo = () => {
  const { exibirLoader } = useEventosCadastro();
  return (
    <Loader loading={exibirLoader}>
      <Cabecalho pagina="Cadastro de eventos do calendário escolar (Micro frontend)">
        <EventosCadastroBotoesAcao />
      </Cabecalho>
      <section className="calendario-card">
        <EventosCadastroForm />
      </section>
    </Loader>
  );
};

const EventosCadastro = () => (
  <EventosCadastroProvider>
    <Conteudo />
  </EventosCadastroProvider>
);

export default EventosCadastro;
