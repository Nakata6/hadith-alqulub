import { describe, expect, it } from "vitest";
import { stripViteClient } from "./viteHtml";

describe("stripViteClient", () => {
  it("يحذف عميل Vite مهما اختلف ترتيب السمات أو أضيفت معاملات تخزين مؤقت", () => {
    const html = '<head><script nonce="safe" src="/@vite/client?v=abc" type="module"></script><script type="module" src="/src/main.tsx"></script></head>';
    expect(stripViteClient(html)).toBe('<head><script type="module" src="/src/main.tsx"></script></head>');
  });

  it("لا يحذف وحدات التطبيق الأخرى", () => {
    const html = '<script type="module" src="/src/main.tsx"></script>';
    expect(stripViteClient(html)).toBe(html);
  });
});
