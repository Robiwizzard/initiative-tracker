import { describe, expect, it } from "vitest";
import { SLUG_RE, slugify } from "./slug.js";

describe("slugify", () => {
  it("lowercases and dashes", () => expect(slugify("Goblin Ambush!")).toBe("goblin-ambush"));
  it("trims dashes", () => expect(slugify("  --Hi--  ")).toBe("hi"));
  it("falls back for empty", () => {
    expect(slugify("")).toBe("encounter");
    expect(slugify("!!!")).toBe("encounter");
  });
  it("cuts to 64 chars and always matches the slug pattern", () => {
    const s = slugify("a".repeat(100));
    expect(s.length).toBe(64);
    expect(SLUG_RE.test(s)).toBe(true);
    expect(SLUG_RE.test(slugify("Ünïcode ☃ name"))).toBe(true);
  });
});
