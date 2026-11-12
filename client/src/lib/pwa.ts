export const PWA_OFFLINE_READY_EVENT = "hadith-offline-ready";
export const PWA_UPDATE_READY_EVENT = "hadith-alqulub-pwa-update-ready";
export const PWA_INSTALL_AVAILABLE_EVENT = "hadith-alqulub-pwa-install-available";
export const PWA_INSTALLED_EVENT = "hadith-alqulub-pwa-installed";

type InstallChoice = { outcome: "accepted" | "dismissed"; platform?: string };

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

export function supportsServiceWorker(capabilities: { serviceWorker?: unknown } | null | undefined) {
  return Boolean(capabilities && "serviceWorker" in capabilities);
}

export async function unregisterDevelopmentServiceWorkers() {
  if (typeof window === "undefined" || !supportsServiceWorker(navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.filter(registration => registration.scope === new URL(import.meta.env.BASE_URL, window.location.origin).href).map(registration => registration.unregister()));
}

export function canOfferPWAInstall(hasDeferredPrompt: boolean, isStandalone: boolean) {
  return hasDeferredPrompt && !isStandalone;
}

export function hasPWAInstallPrompt() {
  return deferredInstallPrompt !== null;
}

export function isPWAInstalled() {
  if (typeof window === "undefined") return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

export async function promptToInstallPWA(): Promise<InstallChoice["outcome"] | "unavailable"> {
  const prompt = deferredInstallPrompt;
  if (!prompt) return "unavailable";

  deferredInstallPrompt = null;
  await prompt.prompt();
  const choice = await prompt.userChoice;
  return choice.outcome;
}

export function registerServiceWorker() {
  if (typeof window === "undefined" || !supportsServiceWorker(navigator)) return;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event(PWA_INSTALL_AVAILABLE_EVENT));
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    window.dispatchEvent(new Event(PWA_INSTALLED_EVENT));
  });

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL, updateViaCache: "none" });
      const announceWaitingWorker = () => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          window.dispatchEvent(new Event(PWA_UPDATE_READY_EVENT));
        }
      };

      void navigator.serviceWorker.ready.then(() => window.dispatchEvent(new Event(PWA_OFFLINE_READY_EVENT)));
      announceWaitingWorker();
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed") announceWaitingWorker();
        });
      });
    } catch {
      // The website remains fully usable when registration is unavailable.
    }
  };

  void register();
}

const UPDATE_TIMEOUT = 60_000;

export async function getAppRegistration() {
  if (!supportsServiceWorker(navigator)) throw new Error("هذا المتصفح لا يدعم تحديث النسخة المحلية.");
  const registration = await navigator.serviceWorker.getRegistration(new URL(import.meta.env.BASE_URL, location.origin).href);
  if (!registration) throw new Error("النسخة المحلية غير جاهزة. افتح اللعبة متصلاً بالإنترنت وحاول مجددًا.");
  return registration;
}

export async function checkForAppUpdate(onDownloading: () => void): Promise<boolean> {
  if (!navigator.onLine) throw new Error("اتصل بالإنترنت للبحث عن تحديث. يمكنك مواصلة اللعب دون اتصال.");
  const registration = await getAppRegistration();
  if (registration.waiting) return true;
  return new Promise((resolve, reject) => {
    let worker: ServiceWorker | null = null;
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      registration.removeEventListener("updatefound", found);
      worker?.removeEventListener("statechange", changed);
    };
    const finish = (error?: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(new Error(error)); else resolve(Boolean(registration.waiting));
    };
    const changed = () => {
      if (worker?.state === "installed" || worker?.state === "activated") finish();
      else if (worker?.state === "redundant") finish("تعذر تنزيل التحديث كاملًا. النسخة الحالية محفوظة؛ حاول مجددًا.");
    };
    const found = () => {
      if (settled) return;
      worker?.removeEventListener("statechange", changed);
      worker = registration.installing;
      if (worker) { onDownloading(); worker.addEventListener("statechange", changed); changed(); }
    };
    const timer = setTimeout(() => finish("استغرق التحديث وقتًا طويلًا. تحقق من الاتصال وحاول مجددًا."), UPDATE_TIMEOUT);
    registration.addEventListener("updatefound", found);
    if (registration.installing) found();
    void registration.update().then(() => {
      if (registration.waiting) finish();
      else if (registration.installing) found();
      else finish();
    }).catch(() => finish("تعذر الاتصال بمصدر التحديث. تحقق من الإنترنت وحاول مجددًا."));
  });
}

export async function getInstalledRevision(): Promise<string> {
  const worker = navigator.serviceWorker?.controller;
  if (!worker) return "غير جاهزة";
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const finish = (value: string) => { clearTimeout(timer); channel.port1.close(); resolve(value); };
    const timer = setTimeout(() => finish("غير متاحة"), 2000);
    channel.port1.onmessage = event => finish(typeof event.data?.revision === "string" ? event.data.revision : "غير متاحة");
    try {
      worker.postMessage({ type: "GET_VERSION" }, [channel.port2]);
    } catch {
      channel.port2.close();
      finish("غير متاحة");
    }
  });
}

export async function applyServiceWorkerUpdate() {
  const registration = await getAppRegistration();
  const worker = registration.waiting;
  if (!worker) return false;
  return new Promise<boolean>((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange); };
    const onControllerChange = () => {
      cleanup(); resolve(true); window.location.reload();
    };
    const timer = setTimeout(() => { cleanup(); reject(new Error("تعذر تفعيل التحديث. أعد المحاولة أو أغلق اللعبة وافتحها مجددًا.")); }, 15000);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    try {
      worker.postMessage({ type: "SKIP_WAITING" });
    } catch {
      cleanup();
      reject(new Error("تعذر تفعيل التحديث. أعد المحاولة أو أغلق اللعبة وافتحها مجددًا."));
    }
  });
}
