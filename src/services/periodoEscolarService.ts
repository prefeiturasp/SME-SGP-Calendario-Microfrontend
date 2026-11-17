import type { FontePeriodosEscolares } from "../core/periodoEscolar";
import { periodoEscolarMock } from "../mocks/periodoEscolarMock";

// História 160058: substituir apenas este adaptador ao integrar o BFF.
export const periodoEscolarService: FontePeriodosEscolares = periodoEscolarMock;
