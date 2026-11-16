const textoDoCampo = (valor: unknown): string =>
  typeof valor === "string" || typeof valor === "number" ? String(valor) : "";

export {
    textoDoCampo
}