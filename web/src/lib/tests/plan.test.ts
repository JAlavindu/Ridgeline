import { describe, expect, it } from "vitest";
import { DEFAULT_PLAN, MAX_CARDS, planReducer, type PlanState } from "../plan";

const card = { site: { kind: "preset" as const, siteId: "im-1" }, startUtc: "2026-12-01T00:00", missionDays: 14 };

describe("planReducer", () => {
  it("adds a card and selects it", () => {
    const next = planReducer(DEFAULT_PLAN, { type: "add", card });
    expect(next.cards).toHaveLength(3);
    expect(next.selectedId).toBe(next.cards[2].id);
  });

  it("never holds more than four cards", () => {
    let s: PlanState = DEFAULT_PLAN;
    for (let i = 0; i < 6; i++) s = planReducer(s, { type: "add", card });
    expect(s.cards).toHaveLength(MAX_CARDS);
    expect(planReducer(s, { type: "duplicate", id: s.cards[0].id })).toBe(s);
  });

  it("duplicates next to the source with a new id", () => {
    const next = planReducer(DEFAULT_PLAN, { type: "duplicate", id: "default-a" });
    expect(next.cards[1].site).toEqual(next.cards[0].site);
    expect(next.cards[1].id).not.toBe("default-a");
    expect(next.selectedId).toBe(next.cards[1].id);
  });

  it("updates one card only", () => {
    const next = planReducer(DEFAULT_PLAN, { type: "update", id: "default-b", patch: { missionDays: 7 } });
    expect(next.cards[1].missionDays).toBe(7);
    expect(next.cards[0].missionDays).toBe(14);
  });

  it("removes a card but never the last one, and moves the selection", () => {
    const one = planReducer(DEFAULT_PLAN, { type: "remove", id: "default-a" });
    expect(one.cards.map((c) => c.id)).toEqual(["default-b"]);
    expect(one.selectedId).toBe("default-b");
    expect(planReducer(one, { type: "remove", id: "default-b" })).toBe(one);
  });

  it("ignores selecting a card that does not exist", () => {
    expect(planReducer(DEFAULT_PLAN, { type: "select", id: "nope" })).toBe(DEFAULT_PLAN);
  });
});
