import { describe, expect, it } from "vitest";
import { clampDays, DEFAULT_PLAN, MAX_CARDS, MAX_MISSION_DAYS, normalizePlan, planReducer, sampleMinutesFor, type PlanState } from "../plan";

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

  it("a new column follows the shared mission, whatever dates it came with", () => {
    const next = planReducer(DEFAULT_PLAN, { type: "add", card: { ...card, startUtc: "2030-01-01T00:00", missionDays: 3 } });
    expect(next.cards[2].startUtc).toBe(DEFAULT_PLAN.mission.startUtc);
    expect(next.cards[2].missionDays).toBe(DEFAULT_PLAN.mission.missionDays);
  });

  it("changing the mission moves every column that follows it, but not one with its own dates", () => {
    const own = planReducer(DEFAULT_PLAN, { type: "ownDates", id: "default-b", on: true });
    const next = planReducer(own, { type: "mission", patch: { startUtc: "2027-03-01T06:00", missionDays: 21 } });
    expect(next.mission).toEqual({ startUtc: "2027-03-01T06:00", missionDays: 21 });
    expect(next.cards[0]).toMatchObject({ startUtc: "2027-03-01T06:00", missionDays: 21 });
    expect(next.cards[1]).toMatchObject({ startUtc: "2026-12-01T00:00", missionDays: 14, ownDates: true });
  });

  it("switching own dates off puts the column back on the shared mission", () => {
    let s: PlanState = planReducer(DEFAULT_PLAN, { type: "ownDates", id: "default-b", on: true });
    s = planReducer(s, { type: "update", id: "default-b", patch: { startUtc: "2028-05-05T00:00" } });
    s = planReducer(s, { type: "ownDates", id: "default-b", on: false });
    expect(s.cards[1]).toMatchObject({ startUtc: DEFAULT_PLAN.mission.startUtc, ownDates: false });
  });
});

describe("normalizePlan", () => {
  it("falls back to the default plan for nothing or junk", () => {
    expect(normalizePlan(null)).toBe(DEFAULT_PLAN);
    expect(normalizePlan({ cards: [] })).toBe(DEFAULT_PLAN);
  });

  it("upgrades a plan saved before the shared mission: first column's dates become the mission", () => {
    const old = {
      cards: [
        { id: "a", site: card.site, startUtc: "2026-12-01T00:00", missionDays: 14 },
        { id: "b", site: card.site, startUtc: "2027-01-10T00:00", missionDays: 7 },
      ],
      selectedId: "b",
    };
    const s = normalizePlan(old);
    expect(s.mission).toEqual({ startUtc: "2026-12-01T00:00", missionDays: 14 });
    expect(s.cards[0].ownDates).toBe(false);
    expect(s.cards[1]).toMatchObject({ ownDates: true, startUtc: "2027-01-10T00:00", missionDays: 7 });
    expect(s.selectedId).toBe("b");
  });
});

describe("mission length (Part 4)", () => {
  it("accepts 1 to 365 days and clamps anything else", () => {
    expect(MAX_MISSION_DAYS).toBe(365);
    expect(clampDays(90)).toBe(90);
    expect(clampDays(500)).toBe(365);
    expect(clampDays(0)).toBe(1);
    expect(clampDays(12.6)).toBe(13);
    expect(clampDays("junk")).toBe(14);
  });

  it("a saved plan with impossible lengths is clamped when loaded", () => {
    const s = normalizePlan({
      cards: [{ id: "a", site: card.site, startUtc: "2026-12-01T00:00", missionDays: 500 }],
      mission: { startUtc: "2026-12-01T00:00", missionDays: 0 },
      selectedId: "a",
    });
    expect(s.mission.missionDays).toBe(1);
    expect(s.cards[0].missionDays).toBe(1); // it follows the shared mission
  });

  it("samples every 10 minutes up to 90 days and every 30 minutes beyond", () => {
    expect(sampleMinutesFor(14)).toBe(10);
    expect(sampleMinutesFor(90)).toBe(10);
    expect(sampleMinutesFor(91)).toBe(30);
    expect(sampleMinutesFor(365)).toBe(30);
  });
});
