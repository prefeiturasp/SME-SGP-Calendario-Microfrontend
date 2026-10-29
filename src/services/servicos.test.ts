import { beforeEach, describe, expect, it, vi } from "vitest";
import { Modalidade, ModalidadeTipoCalendario } from "../core/constantes";

vi.mock("../core/servico/apiSgp", () => ({
  getSgp: vi.fn(),
  postSgp: vi.fn(),
  putSgp: vi.fn(),
  deleteSgp: vi.fn(),
}));

import { deleteSgp, getSgp, postSgp, putSgp } from "../core/servico/apiSgp";
import { abrangenciaService } from "./abrangenciaService";
import { calendarioService } from "./calendarioService";
import { fechamentoReaberturaService } from "./fechamentoReaberturaService";
import { periodoEscolarService } from "./periodoEscolarService";
import { periodoFechamentoService } from "./periodoFechamentoService";

const get = vi.mocked(getSgp);
const post = vi.mocked(postSgp);
const put = vi.mocked(putSgp);
const remover = vi.mocked(deleteSgp);

describe("serviços HTTP do calendário", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta tipos de calendário e converte a modalidade", () => {
    calendarioService.obterTiposCalendarioAutoComplete("fund");
    expect(get).toHaveBeenCalledWith(
      "v1/calendarios/tipos/anos-letivos?descricao=fund",
    );
    expect(calendarioService.converterModalidade(ModalidadeTipoCalendario.EJA)).toBe(
      Modalidade.EJA,
    );
    expect(
      calendarioService.converterModalidade(ModalidadeTipoCalendario.FUNDAMENTAL_MEDIO),
    ).toBe(Modalidade.FUNDAMENTAL);
  });

  it("mantém o endpoint atual de período escolar", () => {
    periodoEscolarService.obterPorTipoCalendario(12);
    periodoEscolarService.salvar({ tipoCalendario: 12 });
    expect(get).toHaveBeenCalledWith("v1/periodo-escolar", {
      params: { codigoTipoCalendario: 12 },
    });
    expect(post).toHaveBeenCalledWith("v1/periodo-escolar", { tipoCalendario: 12 });
  });

  it("mantém o endpoint atual de fechamento e abertura com aplicação SGP", () => {
    periodoFechamentoService.obterPorTipoCalendario(8);
    periodoFechamentoService.salvar({ id: 1 });
    expect(get).toHaveBeenCalledWith(
      "/v1/periodos/fechamentos/aberturas?tipoCalendarioId=8&aplicacao=1",
    );
    expect(post).toHaveBeenCalledWith("/v1/periodos/fechamentos/aberturas", {
      id: 1,
      aplicacao: 1,
    });
  });

  it("lista, altera e exclui reaberturas nos endpoints atuais", () => {
    fechamentoReaberturaService.listar(2, 10, { tipoCalendarioId: 3, dreCodigo: "" });
    fechamentoReaberturaService.obterPorId(9);
    fechamentoReaberturaService.salvar({ id: 9, descricao: "A" });
    fechamentoReaberturaService.salvar({ descricao: "B" });
    fechamentoReaberturaService.deletar([1, 2]);

    expect(get).toHaveBeenCalledWith(
      "v1/fechamentos/reaberturas?numeroPagina=2&numeroRegistros=10",
      { params: { tipoCalendarioId: 3, dreCodigo: "" } },
    );
    expect(get).toHaveBeenCalledWith("v1/fechamentos/reaberturas/9");
    expect(put).toHaveBeenCalledWith("v1/fechamentos/reaberturas/9", {
      id: 9,
      descricao: "A",
    });
    expect(post).toHaveBeenCalledWith("v1/fechamentos/reaberturas", { descricao: "B" });
    expect(remover).toHaveBeenCalledWith("v1/fechamentos/reaberturas", [1, 2]);
  });

  it("busca DRE e UE na abrangência atual", () => {
    abrangenciaService.buscarDres();
    abrangenciaService.buscarUes("10", 5, true, 2026);
    expect(get).toHaveBeenCalledWith("/v1/abrangencias/false/dres");
    expect(get).toHaveBeenCalledWith("/v1/abrangencias/true/dres/10/ues", {
      params: { modalidade: 5, anoLetivo: 2026 },
    });
  });
});
