import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCuentaRegresiva } from "./use-cuenta-regresiva";

describe("useCuentaRegresiva", () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date("2030-01-01T00:00:00Z") }));
  afterEach(() => vi.useRealTimers());

  it("cuenta con la hora del server aunque el reloj del dispositivo esté adelantado", () => {
    const { result } = renderHook(() => useCuentaRegresiva("2026-11-27T15:15:00Z", "2026-11-27T15:00:00Z"));

    expect(result.current).toBe(15 * 60);
    act(() => vi.advanceTimersByTime(61_000));
    expect(result.current).toBe(15 * 60 - 61);
  });

  it("se detiene en cero", () => {
    const { result } = renderHook(() => useCuentaRegresiva("2026-11-27T15:00:05Z", "2026-11-27T15:00:00Z"));

    act(() => vi.advanceTimersByTime(10_000));

    expect(result.current).toBe(0);
  });

  it("sin vencimiento no cuenta nada", () => {
    const { result } = renderHook(() => useCuentaRegresiva(null, "2026-11-27T15:00:00Z"));

    expect(result.current).toBeUndefined();
  });
});
