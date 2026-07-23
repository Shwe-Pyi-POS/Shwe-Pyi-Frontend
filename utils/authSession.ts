const VALIDATED_TOKEN_KEY = "authValidatedToken";
const VALIDATED_AT_KEY = "authValidatedAt";
/** Re-validate with the API after this many ms (30 minutes). */
const VALIDATION_TTL_MS = 30 * 60 * 1000;

export function markSessionValidated(token: string): void {
  sessionStorage.setItem(VALIDATED_TOKEN_KEY, token);
  sessionStorage.setItem(VALIDATED_AT_KEY, String(Date.now()));
}

export function isSessionValidated(token: string): boolean {
  const cachedToken = sessionStorage.getItem(VALIDATED_TOKEN_KEY);
  const validatedAt = sessionStorage.getItem(VALIDATED_AT_KEY);
  if (!cachedToken || !validatedAt || cachedToken !== token) {
    return false;
  }
  const age = Date.now() - Number(validatedAt);
  return age >= 0 && age < VALIDATION_TTL_MS;
}

export function clearSessionValidation(): void {
  sessionStorage.removeItem(VALIDATED_TOKEN_KEY);
  sessionStorage.removeItem(VALIDATED_AT_KEY);
}
