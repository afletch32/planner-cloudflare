import { ValidationError } from './errors.js';

export function validateOrder(value) {
  if (!Number.isInteger(value)) {
    throw new ValidationError('order must be an integer');
  }
}
