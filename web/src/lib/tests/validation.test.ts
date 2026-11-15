import { describe, expect, it } from "vitest";
import { formatResult, statusOf, type ValidationTest } from "../validation";

function test(over: Partial<ValidationTest>): ValidationTest {
  return {
    id: "V0",
    name: "x",
    what: "",
    tolerance: "",
    result: 1,
    unit: "deg",
    expected_outcome: "pass",
    outcome: "pass",
    passed: true,
    explanation: "",
    ...over,
  };
}

describe("statusOf", () => {
  it("pass", () => expect(statusOf(test({}))).toBe("pass"));
  it("fail", () => expect(statusOf(test({ outcome: "fail", passed: false }))).toBe("fail"));
  it("a test meant to fail, and does, is failed-as-designed", () =>
    expect(statusOf(test({ expected_outcome: "fail", outcome: "fail" }))).toBe("failed-as-designed"));
  it("a test meant to fail, but passes, is a fail", () =>
    expect(statusOf(test({ expected_outcome: "fail", outcome: "pass", passed: false }))).toBe("fail"));
  it("pending", () => expect(statusOf(test({ outcome: "pending", passed: false, result: null }))).toBe("pending"));
  it("info", () => expect(statusOf(test({ expected_outcome: "info", outcome: "info" }))).toBe("info"));
});

describe("formatResult", () => {
  it("shows the unit", () => expect(formatResult(test({ result: 0.5, unit: "deg" }))).toBe("0.5 deg"));
  it("says not run without a number", () => expect(formatResult(test({ result: null }))).toBe("not run"));
});
