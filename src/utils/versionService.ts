// Automated Real Estate CRM Versioning System
// Format: X.YY.ZZZ (e.g. 1.42.123)
// Rules:
// - Third group (Z): numbered from 1 to 1000.
// - Second group (Y): increments by 1 whenever third group increases by 1% (10 units out of 1000).
//   When Y reaches 100, Y resets to 0 and first group (X) increments by 1.
// - Followed by the last update date and time in parentheses: (DD.MM.YYYY, HH:mm).

export interface VersionData {
  major: number; // Grupul 1
  minor: number; // Grupul 2 (0 - 99)
  patch: number; // Grupul 3 (1 - 1000)
  lastUpdated: string; // ISO string
}

const STORAGE_KEY = "brokr_app_version_state";

// Initial base state matching the user's reference: 1.42.123
const DEFAULT_VERSION: VersionData = {
  major: 1,
  minor: 42,
  patch: 123,
  lastUpdated: "2026-10-30T16:10:00.000Z"
};

/**
 * Normalizes version data to ensure all mathematical rules hold:
 * - If patch exceeds 1000, it resets to 1 and increments minor.
 * - If minor reaches 100, minor resets to 0 and major increments.
 */
function normalizeVersion(data: VersionData): VersionData {
  let { major, minor, patch, lastUpdated } = data;

  if (patch > 1000) {
    const overflow = Math.floor((patch - 1) / 1000);
    patch = ((patch - 1) % 1000) + 1;
    minor += overflow * 10;
  }

  if (minor >= 100) {
    major += Math.floor(minor / 100);
    minor = minor % 100;
  }

  return { major, minor, patch, lastUpdated };
}

export function getCurrentVersion(): {
  major: number;
  minor: number;
  patch: number;
  versionCode: string; // "1.42.123"
  dateFormatted: string; // "30.10.2026, 16:10"
  fullDisplay: string; // "1.42.123 (30.10.2026, 16:10)"
} {
  let stored: VersionData = DEFAULT_VERSION;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      stored = normalizeVersion(JSON.parse(raw));
    } else {
      stored = DEFAULT_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  } catch {
    stored = DEFAULT_VERSION;
  }

  const d = new Date(stored.lastUpdated);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const dateFormatted = `${day}.${month}.${year}, ${hours}:${minutes}`;

  const versionCode = `${stored.major}.${stored.minor}.${stored.patch}`;
  const fullDisplay = `${versionCode} (${dateFormatted})`;

  return {
    major: stored.major,
    minor: stored.minor,
    patch: stored.patch,
    versionCode,
    dateFormatted,
    fullDisplay
  };
}

/**
 * Registers an update event, automatically calculating the new version and timestamp.
 * - increments patch by step (default 1).
 * - every 10 points (1% of 1000) in patch, minor advances by 1.
 * - when minor reaches 100, minor resets to 0 and major advances by 1.
 */
export function recordUpdate(step = 1): ReturnType<typeof getCurrentVersion> {
  let stored = DEFAULT_VERSION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch {}

  let patch = stored.patch + step;
  let minor = stored.minor;
  let major = stored.major;

  // Check 1% thresholds (1% of 1000 = 10 units)
  const prevPercent = Math.floor(stored.patch / 10);
  const newPercent = Math.floor(patch / 10);
  const percentDelta = newPercent - prevPercent;
  if (percentDelta > 0) {
    minor += percentDelta;
  }

  if (patch > 1000) {
    patch = ((patch - 1) % 1000) + 1;
  }

  if (minor >= 100) {
    major += Math.floor(minor / 100);
    minor = minor % 100;
  }

  const updated: VersionData = {
    major,
    minor,
    patch,
    lastUpdated: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  return getCurrentVersion();
}
