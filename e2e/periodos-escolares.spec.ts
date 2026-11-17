import { expect, test, type Page } from "@playwright/test";

const rota = "/calendario-escolar/periodos-escolares";
const infantil = "2026 - INF - CALENDÁRIO DE ATIVIDADES 2026 - ED. INFANTIL";
const fundamental = "2026 - EF - CALENDÁRIO 2026 - ENSINO FUNDAMENTAL";
const eja = "2026 - EJA - CALENDÁRIO 2026 - 2º SEMESTRE";
const chamadas = new WeakMap<Page, string[]>();

const selecionar = async (page: Page, calendario: string) => {
  const input = page.getByRole("combobox", { name: /Calendário/ });
  await input.fill(calendario);
  await page
    .locator(".ant-select-item-option")
    .filter({ hasText: calendario })
    .click();
  await expect(
    page.getByRole("region", { name: "Períodos escolares" })
  ).toHaveAttribute("aria-busy", "false");
};
const preencher = async (page: Page, campo: string, valor: string) => {
  const input = page.getByRole("textbox", { name: campo, exact: true });
  await input.click();
  await input.fill(valor);
  await input.press("Enter");
  await input.press("Tab");
};

test.beforeEach(async ({ page }) => {
  const requisicoes: string[] = [];
  chamadas.set(page, requisicoes);
  // O backend fica bloqueado durante toda a automação, incluindo os salvamentos.
  await page.route(/\/api(?:\/|$)/, async (route) => {
    requisicoes.push(route.request().url());
    await route.abort();
  });
  await page.goto(rota);
});

test.afterEach(async ({ page }) => {
  expect(
    chamadas.get(page),
    "A tela não pode depender de requisições à API"
  ).toEqual([]);
});

test("exibe o protótipo e altera sem persistir após recarregar", async ({
  page,
}, testInfo) => {
  await selecionar(page, infantil);
  await expect(
    page.getByRole("heading", { name: "Cadastro do período escolar" })
  ).toBeVisible();
  await expect(page.getByRole("group")).toHaveCount(4);
  await expect(
    page.getByLabel("Fim do 1º Bimestre", { exact: true })
  ).toHaveValue("30/04/2026");
  await expect(
    page.getByRole("button", { name: "Alterar", exact: true })
  ).toBeDisabled();
  await page
    .getByRole("heading", { name: "Cadastro do período escolar" })
    .click();
  await expect(page.locator(".ant-select-dropdown:visible")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("periodos-escolares-desktop.png"),
    fullPage: true,
    animations: "disabled",
  });
  await preencher(page, "Fim do 1º Bimestre", "29/04/2026");
  await page.getByRole("button", { name: "Alterar", exact: true }).click();
  await expect(
    page.getByText("Suas informações foram editadas com sucesso.")
  ).toBeVisible();
  await expect(
    page.getByLabel("Fim do 1º Bimestre", { exact: true })
  ).toHaveValue("29/04/2026");
  await page.reload();
  await selecionar(page, infantil);
  await expect(
    page.getByLabel("Fim do 1º Bimestre", { exact: true })
  ).toHaveValue("30/04/2026");
});

test("rejeita sobreposição e permite corrigir e salvar", async ({ page }) => {
  await selecionar(page, infantil);
  await preencher(page, "Início do 2º Bimestre", "30/04/2026");
  await page.getByRole("button", { name: "Alterar", exact: true }).click();
  await expect(
    page.getByText("As datas do 1º e do 2º bimestres se sobrepõem.")
  ).toBeVisible();
  await expect(
    page.getByText("Suas informações foram editadas com sucesso.")
  ).toHaveCount(0);
  await preencher(page, "Início do 2º Bimestre", "04/05/2026");
  await preencher(page, "Fim do 1º Bimestre", "29/04/2026");
  await page.getByRole("button", { name: "Alterar", exact: true }).click();
  await expect(
    page.getByText("Suas informações foram editadas com sucesso.")
  ).toBeVisible();
});

test("cadastra os quatro bimestres sem gravar o calendário", async ({
  page,
}) => {
  await selecionar(page, fundamental);
  await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
  await expect(
    page.getByText("Data inicial obrigatória", { exact: true })
  ).toHaveCount(4);
  const datas = [
    ["04/02/2026", "30/04/2026"],
    ["04/05/2026", "04/07/2026"],
    ["18/07/2026", "30/09/2026"],
    ["01/10/2026", "22/12/2026"],
  ];
  for (const [indice, par] of datas.entries()) {
    await preencher(page, `Início do ${indice + 1}º Bimestre`, par[0]);
    await preencher(page, `Fim do ${indice + 1}º Bimestre`, par[1]);
  }
  await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
  await expect(
    page.getByText("Suas informações foram salvas com sucesso.")
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Alterar", exact: true })
  ).toBeDisabled();
  await page.reload();
  await selecionar(page, fundamental);
  await expect(
    page.getByLabel("Início do 1º Bimestre", { exact: true })
  ).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Cadastrar", exact: true })
  ).toBeEnabled();
});

test("cadastra somente dois bimestres no semestre", async ({ page }) => {
  await selecionar(page, eja);
  await expect(page.getByRole("group")).toHaveCount(2);
  await preencher(page, "Início do 1º Bimestre", "18/07/2026");
  await preencher(page, "Fim do 1º Bimestre", "30/09/2026");
  await preencher(page, "Início do 2º Bimestre", "01/10/2026");
  await preencher(page, "Fim do 2º Bimestre", "22/12/2026");
  await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
  await expect(
    page.getByText("Suas informações foram salvas com sucesso.")
  ).toBeVisible();
});

test("cancela a edição e acomoda o formulário em uma tela pequena", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await selecionar(page, infantil);
  await preencher(page, "Fim do 1º Bimestre", "29/04/2026");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirmar", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByLabel("Fim do 1º Bimestre", { exact: true })
  ).toHaveValue("30/04/2026");
  await expect(
    page.getByRole("button", { name: "Cancelar", exact: true })
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("periodos-escolares-mobile.png"),
    fullPage: true,
  });
});
