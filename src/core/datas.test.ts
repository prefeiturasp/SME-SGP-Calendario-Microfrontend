import { describe, expect, it } from "vitest";
import { dayjs } from "./datas";

describe("datas", () => {
  it("disponibiliza os métodos que o calendário do Ant Design usa", () => {
    const data = dayjs("2026-03-02");
    expect(typeof data.weekday).toBe("function");
    expect(typeof data.localeData).toBe("function");
    expect(data.locale("en").weekday()).toBeGreaterThanOrEqual(0);
  });
});
