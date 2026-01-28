import { ValidationError } from './errors.js';

export function validateSafetyNote(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('note must be an object');
  }
  if (!payload.userId || typeof payload.userId !== 'string') {
    throw new ValidationError('userId is required');
  }
  if (!payload.note || typeof payload.note !== 'string') {
    throw new ValidationError('note is required');
  }
}

export function validateSafetyNotePatch(patch) {
  if (!patch || typeof patch !== 'object') {
    throw new ValidationError('patch must be an object');
  }
  const keys = Object.keys(patch);
  if (keys.length !== 1 || !('resolved' in patch)) {
    throw new ValidationError('only resolved can be updated');
  }
  if (typeof patch.resolved !== 'boolean') {
    throw new ValidationError('resolved must be boolean');
  }
}
