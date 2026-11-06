// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isSingleWhere, ruleBody, selectorsOf } from "../test-support/css-rules";
import { ResetButton } from "./ResetButton";

const css = readFileSync(resolve(__dirname, "reset-button.css"), "utf8");

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function button() {
  return screen.getByRole("button");
}

// The visible label, the one span not hidden from the accessibility tree.
function shown() {
  const spans = [...button().querySelectorAll(".reset-button-label")];
  const visible = spans.filter((el) => !el.hasAttribute("aria-hidden"));
  expect(visible).toHaveLength(1);
  return visible[0].textContent;
}

function status() {
  return screen.getByRole("status");
}

describe("ResetButton", () => {
  it("imports its own skin, since a barrel side-effect import gets tree-shaken", () => {
    const source = readFileSync(resolve(__dirname, "ResetButton.tsx"), "utf8");
    expect(source).toContain('import "./reset-button.css"');
  });

  it("renders an idle button with an empty live status", () => {
    render(<ResetButton onReset={() => {}} />);
    expect(shown()).toBe("Reset defaults");
    expect(button().getAttribute("type")).toBe("button");
    expect(button().className).toBe("reset-button-control");
    expect(status().textContent).toBe("");
    expect(status().className).toBe("reset-button-status");
    expect(button().getAttribute("aria-describedby")).toBeNull();
    expect(button().textContent).toBe("Reset defaultsConfirm reset");
    expect(screen.getByRole("button", { name: "Reset defaults" })).toBe(button());
    expect(button().parentElement!.className).toBe("reset-button");
  });

  it("arms on the first press and resets only on the second", () => {
    const onReset = vi.fn();
    render(<ResetButton onReset={onReset} />);
    fireEvent.click(button());
    expect(onReset).not.toHaveBeenCalled();
    expect(shown()).toBe("Confirm reset");
    expect(button().className).toBe("reset-button-control reset-button-armed");
    expect(screen.getByRole("button", { name: "Confirm reset" })).toBe(button());
    expect(status().textContent).toBe("Press again.");
    fireEvent.click(button());
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(shown()).toBe("Reset defaults");
    expect(button().className).toBe("reset-button-control");
    expect(status().textContent).toBe("Reset done.");
    fireEvent.click(button());
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(shown()).toBe("Confirm reset");
  });

  it("uses a caller's wording", () => {
    render(
      <ResetButton
        onReset={() => {}}
        label="Reset filters"
        confirmLabel="Really reset?"
        hint="Press again to clear every filter."
        doneMessage="Filters cleared."
      />,
    );
    expect(shown()).toBe("Reset filters");
    fireEvent.click(button());
    expect(shown()).toBe("Really reset?");
    expect(status().textContent).toBe("Press again to clear every filter.");
    fireEvent.click(button());
    expect(status().textContent).toBe("Filters cleared.");
  });

  it("disarms on blur, keeps the done message, and still calls the caller's onBlur", () => {
    const seen: string[] = [];
    const onBlur = vi.fn(() => seen.push(shown()!));
    const onReset = vi.fn();
    render(<ResetButton onReset={onReset} onBlur={onBlur} />);
    fireEvent.click(button());
    fireEvent.blur(button());
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(seen).toEqual(["Confirm reset"]);
    expect(shown()).toBe("Reset defaults");
    expect(status().textContent).toBe("");
    fireEvent.click(button());
    fireEvent.click(button());
    fireEvent.blur(button());
    expect(status().textContent).toBe("Reset done.");
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("disarms on Escape only while armed and still calls the caller's onKeyDown", () => {
    const seen: string[] = [];
    const onKeyDown = vi.fn(() => seen.push(shown()!));
    const outer = vi.fn();
    document.addEventListener("keydown", outer);
    render(<ResetButton onReset={() => {}} onKeyDown={onKeyDown} />);
    expect(fireEvent.keyDown(button(), { key: "Escape" })).toBe(true);
    fireEvent.click(button());
    expect(fireEvent.keyDown(button(), { key: "Enter" })).toBe(true);
    expect(shown()).toBe("Confirm reset");
    expect(fireEvent.keyDown(button(), { key: "Escape" })).toBe(false);
    expect(shown()).toBe("Reset defaults");
    expect(status().textContent).toBe("");
    expect(onKeyDown).toHaveBeenCalledTimes(3);
    expect(seen).toEqual(["Reset defaults", "Confirm reset", "Confirm reset"]);
    expect(outer).toHaveBeenCalledTimes(2);
    document.removeEventListener("keydown", outer);
  });

  it("disarms on a press outside but not on a press inside", () => {
    render(
      <>
        <ResetButton onReset={() => {}} />
        <p>outside</p>
      </>,
    );
    fireEvent.click(button());
    fireEvent.pointerDown(status());
    expect(shown()).toBe("Confirm reset");
    fireEvent.pointerDown(button());
    expect(shown()).toBe("Confirm reset");
    fireEvent.pointerDown(screen.getByText("outside"));
    expect(shown()).toBe("Reset defaults");
  });

  it("clears the done message on a press outside", () => {
    render(<ResetButton onReset={() => {}} />);
    fireEvent.click(button());
    fireEvent.click(button());
    fireEvent.pointerDown(document.body);
    expect(status().textContent).toBe("");
  });

  it("listens for outside presses only while not idle", () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<ResetButton onReset={() => {}} />);
    expect(add.mock.calls.filter(([type]) => type === "pointerdown")).toHaveLength(0);
    fireEvent.click(button());
    const listener = add.mock.calls.find(([type]) => type === "pointerdown")![1];
    unmount();
    expect(remove).toHaveBeenCalledWith("pointerdown", listener, { capture: true });
  });

  it("ignores the second click of a double-click but confirms on a separate click", () => {
    const onReset = vi.fn();
    render(<ResetButton onReset={onReset} />);
    fireEvent.click(button(), { detail: 1 });
    fireEvent.click(button(), { detail: 2 });
    expect(onReset).not.toHaveBeenCalled();
    expect(shown()).toBe("Confirm reset");
    fireEvent.click(button(), { detail: 1 });
    expect(onReset).toHaveBeenCalledTimes(1);
    fireEvent.click(button(), { detail: 0 });
    fireEvent.click(button(), { detail: 0 });
    expect(onReset).toHaveBeenCalledTimes(2);
  });

  it("blocks the repeat clicks of a held Enter key", () => {
    render(<ResetButton onReset={() => {}} />);
    expect(fireEvent.keyDown(button(), { key: "Enter" })).toBe(true);
    expect(fireEvent.keyDown(button(), { key: "Enter", repeat: true })).toBe(false);
    expect(fireEvent.keyDown(button(), { key: " ", repeat: true })).toBe(true);
  });

  it("keeps focus on the button when the status text is pressed", () => {
    render(<ResetButton onReset={() => {}} />);
    expect(fireEvent.mouseDown(status())).toBe(false);
  });

  it("sees outside presses that another handler stops", () => {
    render(
      <>
        <ResetButton onReset={() => {}} />
        <p>outside</p>
      </>,
    );
    const outside = screen.getByText("outside");
    outside.addEventListener("pointerdown", (event) => event.stopPropagation());
    fireEvent.click(button());
    fireEvent.pointerDown(outside);
    expect(shown()).toBe("Reset defaults");
  });

  it("reports nothing as done when onReset throws", () => {
    const onReset = vi.fn(() => {
      throw new Error("storage full");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => {
      errors.push(event.error);
      event.preventDefault();
    };
    window.addEventListener("error", onError);
    render(<ResetButton onReset={onReset} />);
    fireEvent.click(button());
    fireEvent.click(button());
    window.removeEventListener("error", onError);
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(status().textContent).not.toBe("Reset done.");
  });

  it("keeps the done message when the caller disables the button after a reset", () => {
    const { rerender } = render(<ResetButton onReset={() => {}} />);
    fireEvent.click(button());
    fireEvent.click(button());
    rerender(<ResetButton onReset={() => {}} disabled />);
    expect(status().textContent).toBe("Reset done.");
  });

  it("drops the armed state when disabled", () => {
    const { rerender } = render(<ResetButton onReset={() => {}} />);
    fireEvent.click(button());
    rerender(<ResetButton onReset={() => {}} disabled />);
    expect(shown()).toBe("Reset defaults");
    expect(status().textContent).toBe("");
    expect((button() as HTMLButtonElement).disabled).toBe(true);
    rerender(<ResetButton onReset={() => {}} />);
    expect(shown()).toBe("Reset defaults");
  });

  it("keeps the caller's class on the wrapper and other props on the button", () => {
    render(
      <ResetButton
        onReset={() => {}}
        className="wide"
        id="r"
        aria-describedby="note"
        {...({ type: "submit" } as object)}
      />,
    );
    const el = document.getElementById("r")!;
    expect(el.tagName).toBe("BUTTON");
    expect(el.getAttribute("type")).toBe("button");
    expect(el.parentElement!.className).toBe("reset-button wide");
    expect(el.getAttribute("aria-describedby")).toBe("note");
  });

  it("forwards a ref to the button", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<ResetButton onReset={() => {}} ref={ref} />);
    expect(ref.current).toBe(button());
    act(() => ref.current!.focus());
    expect(document.activeElement).toBe(button());
  });
});

describe("reset-button.css", () => {
  it("keeps every selector at zero specificity so caller classes win", () => {
    const selectors = selectorsOf(css);
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(isSingleWhere(s), s).toBe(true);
  });

  it("gives the button at least a 24px target and 44px on coarse pointers", () => {
    expect(ruleBody(css, ":where(.reset-button-control)")).toContain("min-height: 1.5rem");
    const coarse = css.slice(css.indexOf("@media (pointer: coarse)"));
    expect(ruleBody(coarse, ":where(.reset-button-control)")).toContain("min-height: 2.75rem");
  });

  it("marks the armed state with a double-width border, not colour alone", () => {
    const armed = ruleBody(css, ":where(.reset-button-armed)");
    expect(armed).toContain("border: 2px solid var(--text-h)");
    expect(armed).toContain("padding: calc(0.25rem - 1px) calc(0.75rem - 1px)");
  });

  it("shows keyboard focus in the heading colour", () => {
    expect(ruleBody(css, ":where(.reset-button-control:focus-visible)")).toContain(
      "outline: 2px solid var(--text-h)",
    );
  });

  it("dims a disabled button", () => {
    const body = ruleBody(css, ":where(.reset-button-control:disabled)");
    expect(body).toContain("opacity: 0.5");
    expect(body).toContain("cursor: not-allowed");
  });

  it("uses system colours in forced-colors mode", () => {
    const forced = css.slice(css.indexOf("@media (forced-colors: active)"));
    expect(ruleBody(forced, ":where(.reset-button-armed)")).toContain("border-color: Highlight");
    const disabled = ruleBody(forced, ":where(.reset-button-control:disabled)");
    expect(disabled).toContain("color: GrayText");
    expect(disabled).toContain("opacity: 1");
  });

  it("puts the status under the button and keeps the button's size fixed", () => {
    const wrapper = ruleBody(css, ":where(.reset-button)");
    expect(wrapper).toContain("display: inline-grid");
    expect(wrapper).toContain("grid-template-columns: max-content");
    expect(wrapper).toContain("justify-content: start");
    const statusRule = ruleBody(css, ":where(.reset-button-status)");
    expect(statusRule).toContain("overflow-wrap: anywhere");
    expect(statusRule).toContain("width: 0");
    expect(statusRule).toContain("min-width: 100%");
    expect(statusRule).toContain("min-height: 1.5em");
    expect(statusRule).toContain("margin-top: 0.25rem");
    expect(statusRule).toContain("color: var(--text-h)");
    expect(ruleBody(css, ":where(.reset-button-control)")).toContain("display: inline-grid");
    expect(ruleBody(css, ":where(.reset-button-label)")).toContain("grid-area: 1 / 1");
    expect(ruleBody(css, ':where(.reset-button-label[aria-hidden="true"])')).toContain(
      "visibility: hidden",
    );
  });

  it("outlines the idle button in the heading colour for 3:1 contrast", () => {
    expect(ruleBody(css, ":where(.reset-button-control)")).toContain(
      "border: 1px solid var(--text-h)",
    );
  });
});
