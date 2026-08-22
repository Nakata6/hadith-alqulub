import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

const browserPort = 9235;
const profileDir = "/tmp/hadith-vite-preview-profile";
const appUrl = process.env.APP_URL || "https://3000-ipkkkunmbxt0zu91vkc8u-b657d3b8.us4.manus.computer/?from_webdev=1";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function target() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${browserPort}/json`)).json();
      const page = pages.find(item => item.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {}
    await delay(150);
  }
  throw new Error("Chromium DevTools endpoint did not start");
}

function protocol(socket, onEvent) {
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (!message.id) return onEvent(message);
    const deferred = pending.get(message.id);
    if (!deferred) return;
    pending.delete(message.id);
    message.error ? deferred.reject(new Error(message.error.message)) : deferred.resolve(message.result);
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  await rm(profileDir, { recursive: true, force: true });
  const chromium = spawn("chromium", ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${browserPort}`, `--user-data-dir=${profileDir}`, "about:blank"], { stdio: "ignore" });
  try {
    const page = await target();
    const socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
    const consoleErrors = [];
    const send = protocol(socket, message => {
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") consoleErrors.push(message.params.args.map(arg => arg.value || arg.description || "").join(" "));
      if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text || "Unhandled exception");
    });
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");
    await send("Network.setCacheDisabled", { cacheDisabled: true });
    await send("Page.navigate", { url: appUrl });
    await delay(3500);
    const hasViteClient = (await send("Runtime.evaluate", { expression: "document.documentElement.outerHTML.includes('/@vite/client')", returnByValue: true })).result.value;
    const viteErrors = consoleErrors.filter(error => /vite|websocket/i.test(error));
    if (hasViteClient || viteErrors.length) throw new Error(`Vite preview verification failed: ${JSON.stringify({ hasViteClient, viteErrors })}`);
    console.log("vite-preview: HTML clean and no Vite/WebSocket console error in a fresh browser");
    socket.close();
  } finally {
    chromium.kill("SIGKILL");
    await delay(300);
    await rm(profileDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

await main();
