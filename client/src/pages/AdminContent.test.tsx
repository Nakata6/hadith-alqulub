// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  archive: vi.fn(),
  restore: vi.fn(),
  publish: vi.fn(),
  reject: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: 1, role: "admin", name: "المدير" },
    loading: false,
    isAuthenticated: true,
  }),
}));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, onClick, disabled }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button onClick={onClick} disabled={disabled}>{children}</button> }));
vi.mock("@/components/ui/input", () => ({ Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} /> }));
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <div role="dialog">{children}</div> : null,
  AlertDialogAction: ({ children, onClick, disabled }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button onClick={onClick} disabled={disabled}>{children}</button>,
  AlertDialogCancel: ({ children, onClick, disabled }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button onClick={onClick} disabled={disabled}>{children}</button>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ content: { reviewQueue: { invalidate: mocks.invalidate }, listPublished: { invalidate: mocks.invalidate }, listArchived: { invalidate: mocks.invalidate } } }),
    content: {
      reviewQueue: { useQuery: () => ({ data: [], isLoading: false }) },
      listPublished: { useQuery: () => ({ data: [{ id: 21, kind: "question", body: "محتوى منشور" }], isLoading: false }) },
      listArchived: { useQuery: () => ({ data: [{ id: 22, kind: "tip", body: "محتوى مؤرشف" }], isLoading: false }) },
      publish: { useMutation: () => ({ mutate: mocks.publish, isPending: false }) },
      reject: { useMutation: () => ({ mutate: mocks.reject, isPending: false }) },
      archivePublic: { useMutation: (options: { onSuccess?: () => Promise<void> | void }) => ({ mutate: (input: { id: number }) => { mocks.archive(input); void options.onSuccess?.(); }, isPending: false }) },
      restorePublic: { useMutation: (options: { onSuccess?: () => Promise<void> | void }) => ({ mutate: (input: { id: number }) => { mocks.restore(input); void options.onSuccess?.(); }, isPending: false }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import AdminContent from "./AdminContent";

describe("تدفق الأرشفة وإعادة النشر في لوحة المدير", () => {
  beforeEach(() => vi.clearAllMocks());

  it("لا يؤرشف قبل التأكيد، ثم يفتح السجل المؤرشف ويعيد النشر بعد تأكيد مستقل", async () => {
    const cancellationView = render(<AdminContent />);

    fireEvent.click(screen.getByRole("button", { name: /^إيقاف النشر$/ }));
    expect(screen.getByRole("dialog").textContent).toContain("إيقاف نشر المحتوى؟");
    fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));
    expect(mocks.archive).not.toHaveBeenCalled();
    cancellationView.unmount();

    render(<AdminContent />);
    fireEvent.click(screen.getByRole("button", { name: /^إيقاف النشر$/ }));
    fireEvent.click(screen.getByRole("button", { name: "تأكيد إيقاف النشر" }));
    await waitFor(() => expect(mocks.archive).toHaveBeenCalledWith({ id: 21 }));

    fireEvent.click(screen.getByRole("button", { name: "مؤرشف" }));
    expect(screen.getByText("محتوى مؤرشف")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "إعادة النشر" }));
    expect(screen.getByRole("dialog").textContent).toContain("إعادة نشر المحتوى؟");
    fireEvent.click(screen.getByRole("button", { name: "تأكيد إعادة النشر" }));
    await waitFor(() => expect(mocks.restore).toHaveBeenCalledWith({ id: 22 }));
  });
});
