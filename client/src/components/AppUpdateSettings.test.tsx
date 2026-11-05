// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AppUpdateSettings } from "./AppUpdateSettings";
import { applyServiceWorkerUpdate } from "@/lib/pwa";
vi.mock("@/lib/pwa", () => ({
  applyServiceWorkerUpdate: vi.fn().mockResolvedValue(false),
  checkForAppUpdate: vi.fn().mockResolvedValue(false),
  getAppRegistration: vi.fn().mockResolvedValue({ waiting: true }),
  getInstalledRevision: vi.fn().mockResolvedValue("test-revision"),
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it("blocks restart when persistent saving fails", async () => {
  render(<AppUpdateSettings available beforeUpdate={() => false} />);
  fireEvent.click(screen.getByRole("button", { name: "تثبيت التحديث وإعادة فتح اللعبة" }));
  expect(await screen.findByText(/تعذر حفظ بياناتك/)).toBeTruthy();
  expect(applyServiceWorkerUpdate).not.toHaveBeenCalled();
});
it("saves before activating the downloaded release", async () => {
  const save = vi.fn(() => true);
  render(<AppUpdateSettings available beforeUpdate={save} />);
  fireEvent.click(screen.getByRole("button", { name: "تثبيت التحديث وإعادة فتح اللعبة" }));
  expect(await screen.findByText(/لا يوجد تحديث جاهز/)).toBeTruthy();
  expect(save.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(applyServiceWorkerUpdate).mock.invocationCallOrder[0]);
});
