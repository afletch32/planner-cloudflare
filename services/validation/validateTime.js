import { ValidationError } from './errors.js';
import { isValidStartMinutes } from '../utils/time.js';

export function validateDuration(duration, maxMinutes = 480) {
  if (!Number.isFinite(duration) || !Number.isInteger(duration)) {
    throw new ValidationError('duration must be an integer in minutes');
  }
  if (duration < 1 || duration > maxMinutes) {
    throw new ValidationError(`duration must be between 1 and ${maxMinutes}`);
  }
}

export function validateStartMinutes(startMinutes) {
  if (!isValidStartMinutes(startMinutes)) {
    throw new ValidationError('startMinutes must be null or a 15-minute increment between 0 and 1435');
  }
}
