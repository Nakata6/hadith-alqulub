import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

const browserPort = 9229;
const profileDir = "/tmp/hadith-pwa-browser-profile";
const appUrl = "http://127.0.0.1:3010/";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const withTimeout = (promise, label, timeout = 10000) => Promise.race([
  promise,
  delay(timeout).then(() => { throw new Error(`${label} timed out`); }),
]);

async function waitForDebugEndpoint() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${browserPort}/json`);
      if (response.ok) return response.json();
    } catch {
      // Chromium is still starting.
    }
    await delay(200);
  }
  throw new Error("Chromium DevTools endpoint did not start");
}

function createProtocol(socket) {
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    const deferred = pending.get(message.id);
    if (!deferred) return;
    pending.delete(message.id);
    if (message.error) deferred.reject(new Error(message.error.message));
    else deferred.resolve(message.result);
  });

  return (method, params = {}) => withTimeout(new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  }), `CDP ${method}`);
}

async function main() {
  await rm(profileDir, { recursive: true, force: true });
  const chromium = spawn("chromium", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${browserPort}`,
    `--user-data-dir=${profileDir}`,
    "about:blank",
  ], { stdio: "ignore" });

  try {
    const targets = await waitForDebugEndpoint();
    console.log("browser: debug endpoint ready");
    const target = targets.find(item => item.type === "page");
    if (!target?.webSocketDebuggerUrl) throw new Error("No inspectable Chromium page target");

    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    const send = createProtocol(socket);
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");

    console.log("browser: loading production app");
    await send("Page.navigate", { url: appUrl });
    await delay(1800);
    await send("Page.reload");
    await delay(2500);

    console.log("browser: checking service worker");
    const registrationDiagnostic = await send("Runtime.evaluate", {
      expression: "navigator.serviceWorker.getRegistration().then(async existing => { if (existing) return { existing: true, scope: existing.scope }; try { const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' }); return { existing: false, registered: true, scope: registration.scope }; } catch (error) { return { existing: false, error: String(error) }; } })",
      awaitPromise: true,
      returnByValue: true,
    });
    console.log(`browser: registration diagnostic ${JSON.stringify(registrationDiagnostic.result.value)}`);
    await delay(1200);
    await send("Page.reload");
    await delay(1500);
    const serviceWorkerState = await send("Runtime.evaluate", {
      expression: "Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error('service worker readiness timeout')), 5000))]).then(async registration => ({ scope: registration.scope, active: registration.active && registration.active.state, controlled: Boolean(navigator.serviceWorker.controller), caches: await caches.keys() })).catch(error => ({ error: String(error), secure: isSecureContext, hasServiceWorker: 'serviceWorker' in navigator, href: location.href }))",
      awaitPromise: true,
      returnByValue: true,
    });
    const state = serviceWorkerState.result.value;
    if (!state?.controlled || !state.caches?.some(name => name.startsWith("hadith-alqulub-shell-"))) {
      throw new Error(`Service Worker verification failed: ${JSON.stringify(state)}`);
    }

    await send("Network.setCacheDisabled", { cacheDisabled: true });
    if (process.env.WAIT_FOR_REAL_OFFLINE === "1") {
      console.log("browser: ready for real offline test; stop the app server, then send any input");
      await new Promise(resolve => process.stdin.once("data", resolve));
      console.log("browser: testing navigation after app server stop");
    } else {
      await send("Network.emulateNetworkConditions", {
        offline: true,
        latency: 0,
        downloadThroughput: 0,
        uploadThroughput: 0,
        connectionType: "none",
      });
      console.log("browser: simulating offline navigation");
    }
    await send("Page.navigate", { url: `${appUrl}?offline-pwa-verification=1` });
    await delay(900);
    const fallback = await send("Runtime.evaluate", {
      expression: "({ title: document.title, content: document.body.innerText })",
      returnByValue: true,
    });
    const page = fallback.result.value;
    if (!page?.content?.includes("لا يوجد اتصال الآن")) {
      throw new Error(`Offline fallback did not render: ${JSON.stringify(page)}`);
    }

    console.log(`service-worker: active=${state.active}, controlled=${state.controlled}`);
    console.log("offline-fallback: verified");
    socket.close();
  } finally {
    chromium.kill("SIGKILL");
    await delay(500);
    await rm(profileDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

await main();
