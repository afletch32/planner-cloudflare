import { ValidationError } from './errors.js';

function isNullableString(value) {
  return value === null || value === undefined || typeof value === 'string';
}

export function validateSchoolCheckin(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('checkin must be an object');
  }
  if (!payload.status || typeof payload.status !== 'string') {
    throw new ValidationError('status is required');
  }
  if (!isNullableString(payload.note)) {
    throw new ValidationError('note must be a string or null');
  }
}
