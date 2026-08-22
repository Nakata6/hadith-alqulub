import { CHANGELOG, type ChangelogEntry, LATEST_VERSION } from "./changelog";

export const LAST_SEEN_VERSION_STORAGE_KEY = "hadith-alqulub-platform-last-seen-version-v1";

export function unseenChangelogEntries(lastSeenVersion: string | null, maxEntries = 3): ChangelogEntry[] {
  const index = lastSeenVersion ? CHANGELOG.findIndex(entry => entry.version === lastSeenVersion) : -1;
  const unseen = index < 0 ? CHANGELOG : CHANGELOG.slice(0, index);
  return unseen.slice(0, maxEntries);
}

export function shouldShowWhatsNew(lastSeenVersion: string | null) {
  return lastSeenVersion !== LATEST_VERSION && unseenChangelogEntries(lastSeenVersion).length > 0;
}

export function canShowWhatsNew(onboardingCompleted: boolean, hasRestorableSession: boolean) {
  return onboardingCompleted || hasRestorableSession;
}
