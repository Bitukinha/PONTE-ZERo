import { describe, it, expect } from "vitest";
import { riskOf } from "./ponte";

describe("riskOf", () => {
  it("frequência abaixo de 75% é risco alto", () => expect(riskOf({ attendance: 74, grade: 9 })).toBe("alto"));
  it("nota abaixo de 5 é risco alto", () => expect(riskOf({ attendance: 95, grade: 4.9 })).toBe("alto"));
  it("frequência entre 75% e 85% é risco médio", () => expect(riskOf({ attendance: 80, grade: 8 })).toBe("medio"));
  it("frequência e nota boas é risco baixo", () => expect(riskOf({ attendance: 90, grade: 7 })).toBe("baixo"));
});
