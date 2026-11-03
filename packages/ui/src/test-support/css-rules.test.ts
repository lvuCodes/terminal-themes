import { describe, expect, it } from "vitest";
import { isSingleWhere, ruleBody, selectorsOf } from "./css-rules";

describe("css-rules test helpers", () => {
  it("splits multi-line selector lists and skips at-rule preludes", () => {
    const sheet =
      "/* x { } */\n.a,\n:where(.b) { color: red; }\n@media (pointer: coarse) {\n  :where(.c) { gap: 0; }\n}";
    expect(selectorsOf(sheet)).toEqual([".a", ":where(.b)", ":where(.c)"]);
  });

  it("accepts one whole :where() group, optionally with a pseudo-element", () => {
    expect(isSingleWhere(":where(.a:not([b], [c]))")).toBe(true);
    expect(isSingleWhere(":where(.a)::before")).toBe(true);
  });

  it("rejects anything that adds class-level specificity", () => {
    expect(isSingleWhere(".a")).toBe(false);
    expect(isSingleWhere(":where(.a):hover")).toBe(false);
    expect(isSingleWhere(":where(.a), :is(.b)")).toBe(false);
    expect(isSingleWhere(":where(.a")).toBe(false);
  });

  it("returns a rule's declarations and throws for a missing rule", () => {
    expect(ruleBody(":where(.a) { gap: 0; }", ":where(.a)")).toContain("gap: 0");
    expect(() => ruleBody("", ":where(.a)")).toThrow("no rule for :where(.a)");
    expect(() => ruleBody(".x :where(.a) { gap: 0; }", ":where(.a)")).toThrow();
    expect(() => ruleBody("/* :where(.a) { gap: 0; } */", ":where(.a)")).toThrow();
    expect(ruleBody("@media (x) {\n  :where(.a) { gap: 1px; }\n}", ":where(.a)")).toContain(
      "gap: 1px",
    );
  });
});
