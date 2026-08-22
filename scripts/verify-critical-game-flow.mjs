import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

const browserPort = 9236;
const profileDir = "/tmp/hadith-critical-game-flow";
const appUrl = process.env.APP_URL || "http://127.0.0.1:3000/?critical-flow=1";
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
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `localStorage.setItem('hadith-alqulub-platform-onboarding-v1', JSON.stringify({ completed: true, skipped: true, version: 1 })); localStorage.setItem('hadith-alqulub-platform-last-seen-version-v1', '1.7.0');`,
    });
    await send("Page.navigate", { url: appUrl });
    await delay(1200);
    const evaluate = expression => send("Runtime.evaluate", { expression, returnByValue: true }).then(result => result.result.value);
    const requireStep = async (expression, label) => {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (await evaluate(expression)) return;
        await delay(200);
      }
      throw new Error(`Critical game flow failed at: ${label}`);
    };

    await requireStep(`Boolean(document.querySelector('.welcome-card input'))`, "welcome form");
    await evaluate(`(() => { const inputs = document.querySelectorAll('.welcome-card input'); const setValue = (input, value) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); }; setValue(inputs[0], 'علي'); setValue(inputs[1], 'فاطمة'); [...document.querySelectorAll('button')].find(button => button.textContent.includes('بدء الجلسة'))?.click(); })()`);
    await requireStep(`Boolean(document.querySelector('.starter-card'))`, "starter choice");
    await evaluate(`document.querySelector('.starter-card')?.click()`);
    await requireStep(`Boolean(document.querySelector('.question-card:not([disabled])'))`, "game board");
    await requireStep(`Boolean([...document.querySelectorAll('button')].find(button => button.textContent.includes('نصيحة')))`, "daily tip action");
    if (await evaluate(`[...document.querySelectorAll('button')].some(button => button.textContent.includes('سجل النصائح') || button.textContent.includes('فلترة النصائح'))`)) {
      throw new Error("Critical game flow failed: anonymous player can access the tip library controls");
    }
    await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent.includes('نصيحة'))?.click()`);
    await requireStep(`Boolean(document.querySelector('.tip-dialog'))`, "daily tip dialog");
    await evaluate(`document.querySelector('.tip-dialog__close')?.click()`);
    await requireStep(`!document.querySelector('.tip-dialog')`, "daily tip dialog close");
    await evaluate(`document.querySelector('.question-card:not([disabled])')?.click()`);
    await requireStep(`Boolean(document.querySelector('.legacy-question-card')) && Boolean(document.querySelector('.question-actions'))`, "opened card");
    await evaluate(`document.querySelector('.question-actions .primary-button')?.click()`);
    await delay(150);
    await evaluate(`document.querySelector('[aria-label="الإعدادات"]')?.click()`);
    await delay(200);
    await requireStep(`Boolean([...document.querySelectorAll('.dialog-heading h2')].find(title => title.textContent.includes('الإعدادات')))`, "settings dialog");
    await evaluate(`document.querySelector('.dialog-heading .icon-button[aria-label="إغلاق"]')?.click()`);
    await delay(150);
    await requireStep(`!document.querySelector('.settings-dialog')`, "settings dialog close");
    if (consoleErrors.length) throw new Error(`Critical game flow console errors: ${JSON.stringify(consoleErrors)}`);
    console.log("critical-game-flow: session start, single tip access, restricted library controls, card open, and settings close passed");
    socket.close();
  } finally {
    chromium.kill("SIGKILL");
    await delay(300);
    await rm(profileDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

await main();
