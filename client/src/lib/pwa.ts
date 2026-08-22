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
  await Promise.all(registrations.map(registration => registration.unregister()));
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
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const announceWaitingWorker = () => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          window.dispatchEvent(new Event(PWA_UPDATE_READY_EVENT));
        }
      };

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

export async function applyServiceWorkerUpdate() {
  if (typeof window === "undefined" || !supportsServiceWorker(navigator)) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.waiting) return false;

  return new Promise<boolean>(resolve => {
    const onControllerChange = () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      resolve(true);
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    registration.waiting?.postMessage({ type: "SKIP_WAITING" });
  });
}
