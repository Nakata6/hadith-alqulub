import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

const browserPort = 9231;
const profileDir = "/tmp/hadith-pwa-install-button-profile";
const appUrl = "http://127.0.0.1:3010/";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function debugTargets() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${browserPort}/json`);
      if (response.ok) return response.json();
    } catch {
      // Chromium is starting.
    }
    await delay(200);
  }
  throw new Error("Chromium DevTools endpoint did not start");
}

function protocol(socket) {
  let id = 1;
  const pending = new Map();
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = id++;
    pending.set(requestId, { resolve, reject });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
}

async function evaluate(send, expression) {
  const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

async function main() {
  await rm(profileDir, { recursive: true, force: true });
  const chromium = spawn("chromium", ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${browserPort}`, `--user-data-dir=${profileDir}`, "about:blank"], { stdio: "ignore" });

  try {
    const target = (await debugTargets()).find(item => item.type === "page");
    if (!target?.webSocketDebuggerUrl) throw new Error("No inspectable Chromium page target");
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    const send = protocol(socket);
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Page.navigate", { url: appUrl });
    await delay(1600);

    await evaluate(send, "(() => { const event = new Event('beforeinstallprompt', { cancelable: true }); Object.defineProperties(event, { prompt: { value: () => { window.__pwaPromptCalls = (window.__pwaPromptCalls || 0) + 1; return Promise.resolve(); } }, userChoice: { value: Promise.resolve({ outcome: 'dismissed' }) } }); window.dispatchEvent(event); })()");
    await delay(250);
    await evaluate(send, "document.querySelector('[aria-label=\"الإعدادات\"]')?.click()");
    await delay(250);

    const visible = await evaluate(send, "(() => { const button = [...document.querySelectorAll('button')].find(item => item.textContent?.includes('تثبيت التطبيق')); return { text: button?.textContent?.trim(), dialog: document.querySelector('[role=dialog] h2')?.textContent }; })()");
    if (visible.text !== "تثبيت التطبيق" || visible.dialog !== "الإعدادات") throw new Error(`Install control was not visible: ${JSON.stringify(visible)}`);

    await evaluate(send, "[...document.querySelectorAll('button')].find(item => item.textContent?.includes('تثبيت التطبيق'))?.click()");
    await delay(250);
    const outcome = await evaluate(send, "({ promptCalls: window.__pwaPromptCalls || 0, installButtonRemaining: [...document.querySelectorAll('button')].some(item => item.textContent?.includes('تثبيت التطبيق')), notice: document.querySelector('.toast')?.textContent })");
    if (outcome.promptCalls !== 1 || outcome.installButtonRemaining || !outcome.notice?.includes("يمكنكما تثبيت التطبيق لاحقاً")) {
      throw new Error(`Install control outcome was incorrect: ${JSON.stringify(outcome)}`);
    }

    console.log("pwa-install-button: visible and prompt flow verified");
    socket.close();
  } finally {
    chromium.kill("SIGKILL");
    await delay(500);
    await rm(profileDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

await main();
