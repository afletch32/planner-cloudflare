import { ValidationError } from "./errors.js";

function isNullableString(value) {
  return value === null || value === undefined || typeof value === "string";
}

/**
 * Validates the structure and content of an emotion check-in payload.
 *
 * @param {Object} payload - The payload object to validate.
 * @param {string} payload.mood - The mood of the check-in, required and must be a string.
 * @param {string|null} [payload.bodyState] - The body state of the check-in, optional and must be a string or null.
 * @param {string|null} [payload.reason] - The reason for the mood, optional and must be a string or null.
 * @param {string|null} [payload.note] - Additional notes for the check-in, optional and must be a string or null.
 * @throws {ValidationError} Throws an error if the payload is not an object or if any required fields are missing or invalid.
 */
export function validateEmotionCheckin(payload) {
  if (!payload || typeof payload !== "object") {
    throw new ValidationError("checkin must be an object");
  }
  if (!payload.mood || typeof payload.mood !== "string") {
    throw new ValidationError("mood is required");
  }
  if (!isNullableString(payload.bodyState)) {
    throw new ValidationError("bodyState must be a string or null");
  }
  if (!isNullableString(payload.reason)) {
    throw new ValidationError("reason must be a string or null");
  }
  if (!isNullableString(payload.note)) {
    throw new ValidationError("note must be a string or null");
  }
}
