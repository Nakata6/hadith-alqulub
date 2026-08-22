export const PWA_UPDATE_READY_EVENT = "hadith-alqulub-pwa-update-ready";

export function supportsServiceWorker(capabilities: { serviceWorker?: unknown } | null | undefined) {
  return Boolean(capabilities && "serviceWorker" in capabilities);
}

export function registerServiceWorker() {
  if (typeof window === "undefined" || !supportsServiceWorker(navigator)) return;

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
