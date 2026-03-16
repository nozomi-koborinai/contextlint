import { describe, it, expect } from "bun:test";
import { debounce } from "./watch.js";

describe("debounce", () => {
  it("calls the function after the specified delay", async () => {
    let callCount = 0;
    const fn = debounce(() => {
      callCount++;
    }, 50);

    fn();
    expect(callCount).toBe(0);

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(callCount).toBe(1);
  });

  it("resets the timer on subsequent calls within the delay", async () => {
    let callCount = 0;
    const fn = debounce(() => {
      callCount++;
    }, 100);

    fn();
    await new Promise((resolve) => setTimeout(resolve, 50));
    fn(); // Reset timer
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Should not have fired yet (only 50ms since last call)
    expect(callCount).toBe(0);

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(callCount).toBe(1);
  });

  it("fires only once for rapid consecutive calls", async () => {
    let callCount = 0;
    const fn = debounce(() => {
      callCount++;
    }, 50);

    fn();
    fn();
    fn();
    fn();
    fn();

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(callCount).toBe(1);
  });

  it("can fire multiple times if calls are spaced apart", async () => {
    let callCount = 0;
    const fn = debounce(() => {
      callCount++;
    }, 30);

    fn();
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(callCount).toBe(1);

    fn();
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(callCount).toBe(2);
  });
});
