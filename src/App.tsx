import { Provider } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { createMockStore } from "./mocks/mockStore";
import Calendario from "./paginas/calendario/calendario";

const store = createMockStore();

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/calendario-escolar/periodos-escolares" element={<Calendario />} />
        <Route
          path="/calendario-escolar/periodo-fechamento-abertura"
          element={<Calendario />}
        />
        <Route
          path="/calendario-escolar/periodo-fechamento-reabertura"
          element={<Calendario />}
        />
        <Route
          path="/calendario-escolar/periodo-fechamento-reabertura/novo"
          element={<Calendario />}
        />
        <Route
          path="/calendario-escolar/periodo-fechamento-reabertura/novo/:tipoCalendarioId"
          element={<Calendario />}
        />
        <Route
          path="/calendario-escolar/periodo-fechamento-reabertura/editar/:id"
          element={<Calendario />}
        />
        <Route path="*" element={<Calendario />} />
      </Routes>
    </BrowserRouter>
  </Provider>
);

export default App;
