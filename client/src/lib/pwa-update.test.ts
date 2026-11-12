// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyServiceWorkerUpdate, checkForAppUpdate, getInstalledRevision } from "./pwa";

function setup() {
  const registration = Object.assign(new EventTarget(), {
    waiting: null as null | { postMessage: ReturnType<typeof vi.fn> },
    installing: null as null | (EventTarget & { state: string }),
    update: vi.fn().mockResolvedValue(undefined),
  });
  const container = Object.assign(new EventTarget(), { getRegistration: vi.fn().mockResolvedValue(registration) });
  vi.stubGlobal("navigator", { onLine: true, serviceWorker: container });
  return registration;
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe("manual local app updates", () => {
  it("reports offline without starting a network check", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    await expect(checkForAppUpdate(vi.fn())).rejects.toThrow("اتصل بالإنترنت");
  });
  it("explicitly checks and reports no newer release", async () => {
    const r = setup();
    await expect(checkForAppUpdate(vi.fn())).resolves.toBe(false);
    expect(r.update).toHaveBeenCalledOnce();
  });
  it("offers an already downloaded release", async () => {
    const r = setup(); r.waiting = { postMessage: vi.fn() };
    await expect(checkForAppUpdate(vi.fn())).resolves.toBe(true);
  });
  it("does not call an incomplete download ready", async () => {
    const r = setup(); const downloading = vi.fn();
    r.update.mockImplementation(async () => {
      r.installing = Object.assign(new EventTarget(), { state: "installing" });
      r.dispatchEvent(new Event("updatefound"));
      r.installing.state = "redundant";
      r.installing.dispatchEvent(new Event("statechange"));
    });
    await expect(checkForAppUpdate(downloading)).rejects.toThrow("تعذر تنزيل");
    expect(downloading).toHaveBeenCalled();
  });
  it("times out a stalled check", async () => {
    vi.useFakeTimers(); const r = setup(); r.update.mockReturnValue(new Promise(() => {}));
    const result = expect(checkForAppUpdate(vi.fn())).rejects.toThrow("وقتًا طويلًا");
    await vi.advanceTimersByTimeAsync(60001); await result;
  });
  it("times out activation instead of hanging forever", async () => {
    vi.useFakeTimers(); const r = setup(); r.waiting = { postMessage: vi.fn() };
    const result = expect(applyServiceWorkerUpdate()).rejects.toThrow("تعذر تفعيل");
    await vi.advanceTimersByTimeAsync(15001); await result;
    expect(r.waiting.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });
});

it("handles a worker that rejects messages and releases update resources", async () => {
  vi.useFakeTimers();
  const registration = setup();
  const postMessage = vi.fn(() => { throw new Error("worker unavailable"); });
  Object.assign(navigator.serviceWorker, { controller: { postMessage } });
  const close = vi.fn();
  vi.stubGlobal("MessageChannel", class {
    port1 = { close, onmessage: null };
    port2 = { close };
  });
  await expect(getInstalledRevision()).resolves.toBe("غير متاحة");
  expect(close).toHaveBeenCalledTimes(2);
  registration.waiting = { postMessage };
  await expect(applyServiceWorkerUpdate()).rejects.toThrow("تعذر تفعيل التحديث");
  expect(vi.getTimerCount()).toBe(0);
});
