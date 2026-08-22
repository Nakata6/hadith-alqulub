// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ deleteMine: vi.fn(), invalidate: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true, loading: false }) }));
vi.mock("@/components/ContentSuggestionForm", () => ({ ContentSuggestionForm: () => <div>نموذج الاقتراح</div> }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <div role="dialog">{children}</div> : null,
  AlertDialogAction: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  AlertDialogCancel: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ content: { mine: { invalidate: mocks.invalidate } } }),
    content: {
      mine: { useQuery: () => ({ isLoading: false, data: [{ id: 8, kind: "question", status: "pending", body: "سؤال خاص", createdAt: new Date("2026-08-22") }] }) },
      deleteMine: { useMutation: (options: { onSuccess?: () => Promise<void> | void }) => ({ mutate: (input: { id: number }) => { mocks.deleteMine(input); void options.onSuccess?.(); }, isPending: false }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import Suggestions from "./Suggestions";

describe("تأكيد حذف اقتراح المستخدم", () => {
  beforeEach(() => vi.clearAllMocks());

  it("لا يحذف عند فتح النافذة أو إلغائها، ويحذف فقط بعد التأكيد", async () => {
    const cancellationView = render(<Suggestions />);
    fireEvent.click(screen.getByRole("button", { name: "حذف اقتراحي" }));
    expect(screen.getByRole("dialog").textContent).toContain("حذف الاقتراح؟");
    fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));
    expect(mocks.deleteMine).not.toHaveBeenCalled();
    cancellationView.unmount();

    render(<Suggestions />);
    fireEvent.click(screen.getByRole("button", { name: "حذف اقتراحي" }));
    fireEvent.click(screen.getByRole("button", { name: "حذف الاقتراح" }));
    await waitFor(() => expect(mocks.deleteMine).toHaveBeenCalledWith({ id: 8 }));
  });
});
