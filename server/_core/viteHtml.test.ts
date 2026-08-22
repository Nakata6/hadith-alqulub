import { describe, expect, it } from "vitest";
import { isViteClientRequest, stripViteClient, VITE_CLIENT_STUB_MODULE } from "./viteHtml";

describe("stripViteClient", () => {
  it("يحذف عميل Vite مهما اختلف ترتيب السمات أو أضيفت معاملات تخزين مؤقت", () => {
    const html = '<head><script nonce="safe" src="/@vite/client?v=abc" type="module"></script><script type="module" src="/src/main.tsx"></script></head>';
    expect(stripViteClient(html)).toBe('<head><script type="module" src="/src/main.tsx"></script></head>');
  });

  it("لا يحذف وحدات التطبيق الأخرى", () => {
    const html = '<script type="module" src="/src/main.tsx"></script>';
    expect(stripViteClient(html)).toBe(html);
  });

  it("يحذف الاستيراد الداخلي ورابط التحميل المسبق لعميل Vite", () => {
    const html = '<head><link rel="modulepreload" href="/@vite/client?v=old"><script type="module">import "/@vite/client";</script><script type="module" src="/src/main.tsx"></script></head>';
    expect(stripViteClient(html)).toBe('<head><script type="module" src="/src/main.tsx"></script></head>');
  });

  it("يتعرف على طلب عميل Vite ويعيد وحدة خاملة توافق CSS ولا تحتوي منطق WebSocket", () => {
    expect(isViteClientRequest("/@vite/client")).toBe(true);
    expect(isViteClientRequest("/@vite/client/")).toBe(true);
    expect(isViteClientRequest("/src/main.tsx")).toBe(false);
    expect(VITE_CLIENT_STUB_MODULE).not.toContain("WebSocket");
    expect(VITE_CLIENT_STUB_MODULE).toContain("createHotContext");
    expect(VITE_CLIENT_STUB_MODULE).toContain("updateStyle");
    expect(VITE_CLIENT_STUB_MODULE).toContain("removeStyle");
  });
});
