const VITE_CLIENT_URL = String.raw`(?:https?:\/\/[^"']+)?\/@vite\/client(?:\?[^"']*)?`;

export const VITE_CLIENT_STUB_MODULE = String.raw`const styles = new Map();
export function updateStyle(id, content) {
  if (typeof document === "undefined") return;
  let style = styles.get(id);
  if (!style) {
    style = document.querySelector('style[data-vite-dev-id="' + id + '"]');
    if (!style) {
      style = document.createElement("style");
      style.setAttribute("type", "text/css");
      style.setAttribute("data-vite-dev-id", id);
      document.head.appendChild(style);
    }
    styles.set(id, style);
  }
  style.textContent = content;
}
export function removeStyle(id) {
  const style = styles.get(id) || document.querySelector('style[data-vite-dev-id="' + id + '"]');
  if (style) style.remove();
  styles.delete(id);
}
const inactiveHotContext = {
  data: {}, accept() {}, acceptExports() {}, dispose() {}, prune() {}, invalidate() {}, on() {}, off() {}, send() {},
};
export function createHotContext() { return inactiveHotContext; }
export function injectQuery(url) { return url; }
`;

export function isViteClientRequest(requestPath: string) {
  return requestPath === "/@vite/client" || requestPath === "/@vite/client/";
}

export function stripViteClient(html: string) {
  return html
    .replace(
      new RegExp(`<script\\b[^>]*\\bsrc=(["'])${VITE_CLIENT_URL}\\1[^>]*>\\s*<\\/script>\\s*`, "gi"),
      "",
    )
    .replace(
      new RegExp(`<link\\b[^>]*\\bhref=(["'])${VITE_CLIENT_URL}\\1[^>]*>\\s*`, "gi"),
      "",
    )
    .replace(
      new RegExp(`<script\\b[^>]*>\\s*import\\s*(?:[^;]*?\\s+from\\s*)?["']${VITE_CLIENT_URL}["'];?\\s*<\\/script>\\s*`, "gi"),
      "",
    );
}
