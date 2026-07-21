// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Terminal } from "./Terminal";
import { ANSI_SLOTS, ROLE_SLOTS, slotTag } from "./ansi";

afterEach(cleanup);

describe("ansi role map", () => {
  it("covers all sixteen slots exactly once", () => {
    expect(ANSI_SLOTS).toHaveLength(16);
    expect(new Set(ANSI_SLOTS.map((s) => s.slot)).size).toBe(16);
  });

  it("binds error, branding and fast mode to the same busy bright-red slot", () => {
    // The reference calls this out as the highest-conflict slot; if the map ever
    // drifts apart here, the panel stops demonstrating the conflict.
    expect(ROLE_SLOTS.error).toBe(9);
    expect(ROLE_SLOTS.claude).toBe(9);
    expect(ROLE_SLOTS.fast).toBe(9);
  });

  it("uses the normal slots for diff lines and the bright ones for diff words", () => {
    expect(ROLE_SLOTS.diffRemoved).toBe(1);
    expect(ROLE_SLOTS.diffAdded).toBe(2);
    expect(ROLE_SLOTS.diffRemovedWord).toBe(9);
    expect(ROLE_SLOTS.diffAddedWord).toBe(10);
  });

  it("pairs a bright slot with its normal counterpart in the tag", () => {
    expect(slotTag("error")).toBe("[09:01]");
    expect(slotTag("success")).toBe("[10:02]");
    expect(slotTag("plan")).toBe("[14:06]");
  });

  it("pairs a normal slot with itself — diff lines don't shift between modes", () => {
    expect(slotTag("diffRemoved")).toBe("[01:01]");
    expect(slotTag("diffAdded")).toBe("[02:02]");
  });

  it("pairs the inverting roles with their true light-mode slot, not slot minus 8", () => {
    // text/dim/inverse flip rather than dim, so a mechanical -8 would be wrong.
    expect(slotTag("text")).toBe("[15:00]");
    expect(slotTag("dim")).toBe("[07:08]");
    expect(slotTag("inverse")).toBe("[00:07]");
  });
});

describe("<Terminal>", () => {
  it("renders a swatch for every ANSI slot", () => {
    const { container } = render(<Terminal ansiMode="dark" onAnsiModeChange={() => {}} />);
    expect(container.querySelectorAll(".term-slot")).toHaveLength(16);
  });

  it("renders each reference section", () => {
    render(<Terminal ansiMode="dark" onAnsiModeChange={() => {}} />);
    for (const label of [
      "PALETTE",
      "BRANDING + STATUS",
      "PERMISSION",
      "TOOL CALL",
      "DIFF",
      "PROSE",
      "USER MESSAGE",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("accepts a custom window title", () => {
    render(<Terminal ansiMode="dark" onAnsiModeChange={() => {}} title="zsh — demo" />);
    expect(screen.getByText("zsh — demo")).toBeTruthy();
  });
});
