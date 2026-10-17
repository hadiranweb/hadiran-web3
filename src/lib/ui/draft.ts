const PREFIX = "hadiran-draft:";
const MAX_CHARS = 400_000;

export const ACCOUNT_CHANGED = "hadiran:account";

export type AccountChangedDetail = {
  givenName?: string;
  familyName?: string;
  displayName?: string | null;
};

function fullKey(key: string) {
  return key.startsWith(PREFIX) ? key : `${PREFIX}${key}`;
}

export function readDraft<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(fullKey(key));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeDraft(key: string, value: unknown) {
  try {
    const raw = JSON.stringify(value);
    if (raw.length > MAX_CHARS) return;
    sessionStorage.setItem(fullKey(key), raw);
  } catch {
    // quota / private mode
  }
}

export function clearDraft(key: string) {
  try {
    sessionStorage.removeItem(fullKey(key));
  } catch {
    // ignore
  }
}

export function clearDraftsByPrefix(prefix: string) {
  try {
    const needle = fullKey(prefix);
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(needle)) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export function publishAccount(detail: AccountChangedDetail) {
  window.dispatchEvent(new CustomEvent<AccountChangedDetail>(ACCOUNT_CHANGED, { detail }));
}

export function subscribeAccount(handler: (detail: AccountChangedDetail) => void) {
  const onEvent = (event: Event) => {
    handler((event as CustomEvent<AccountChangedDetail>).detail || {});
  };
  window.addEventListener(ACCOUNT_CHANGED, onEvent);
  return () => window.removeEventListener(ACCOUNT_CHANGED, onEvent);
}
