// Canonical day tokens for the tutor_profiles.available_days SET column.
// Shared between the search filter (tutorController) and profile writes
// (TutorProfile.upsert) so both sides agree on what a "valid day" is.
export const DAY_TOKENS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/**
 * Normalizes a comma-separated string or array of day tokens into a
 * de-duplicated, validated array of lowercase tokens in canonical order.
 * Unknown tokens are silently dropped rather than rejected outright, so a
 * stray value never breaks a search or a profile save.
 */
export const parseDays = (value) => {
  const raw = Array.isArray(value) ? value : String(value ?? "").split(",");
  const valid = new Set(
    raw.map((item) => String(item).trim().toLowerCase()).filter((item) => DAY_TOKENS.includes(item)),
  );
  return DAY_TOKENS.filter((day) => valid.has(day));
};
