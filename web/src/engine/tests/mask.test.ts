import { describe, expect, it } from "vitest";
import { isRealMask } from "../mask";
import { loadMaskFromDisk } from "./loadFromDisk";

describe("isRealMask", () => {
  it("placeholder masks are not real terrain", () => {
    expect(isRealMask(loadMaskFromDisk("apollo11"))).toBe(false);
    expect(isRealMask(loadMaskFromDisk("chandrayaan3_isro"))).toBe(false);
  });
  it("LOLA masks are real terrain", () => {
    expect(isRealMask(loadMaskFromDisk("im1"))).toBe(true);
    expect(isRealMask(loadMaskFromDisk("connecting_ridge"))).toBe(true);
  });
});
