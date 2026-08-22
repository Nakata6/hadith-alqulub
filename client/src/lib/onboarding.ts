export const ONBOARDING_STORAGE_KEY = "hadith-alqulub-platform-onboarding-v1";
export const ONBOARDING_VERSION = 1;

export type OnboardingState = {
  completed: boolean;
  skipped: boolean;
  version: number;
};

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  completed: false,
  skipped: false,
  version: ONBOARDING_VERSION,
};

export function normalizeOnboardingState(value: unknown): OnboardingState {
  if (!value || typeof value !== "object") return { ...DEFAULT_ONBOARDING_STATE };
  const stored = value as Partial<OnboardingState>;
  return {
    completed: stored.completed === true,
    skipped: stored.skipped === true,
    version: typeof stored.version === "number" ? stored.version : ONBOARDING_VERSION,
  };
}

export function shouldStartOnboarding(state: OnboardingState, hasRestorableSession: boolean) {
  return !hasRestorableSession && (!state.completed || state.version !== ONBOARDING_VERSION);
}

export function completionState(skipped: boolean): OnboardingState {
  return { completed: true, skipped, version: ONBOARDING_VERSION };
}
