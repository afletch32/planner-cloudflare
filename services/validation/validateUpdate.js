import { ValidationError } from './errors.js';
import { validateDuration, validateStartMinutes } from './validateTime.js';
import { validateOrder } from './validateOrder.js';
import { TASK_STATUSES, ASSIGNEES, CATEGORIES } from '../models/taskModel.js';

export function validateUpdate(patch) {
  if (!patch || typeof patch !== 'object') {
    throw new ValidationError('update payload must be an object');
  }
  if ('duration' in patch) {
    validateDuration(patch.duration);
  }
  if ('startMinutes' in patch) {
    validateStartMinutes(patch.startMinutes);
  }
  if ('order' in patch) {
    validateOrder(patch.order);
  }
  if ('status' in patch && !TASK_STATUSES.includes(patch.status)) {
    throw new ValidationError('status is invalid');
  }
  if ('assignedTo' in patch && !ASSIGNEES.includes(patch.assignedTo)) {
    throw new ValidationError('assignedTo is invalid');
  }
  if ('category' in patch && !CATEGORIES.includes(patch.category)) {
    throw new ValidationError('category is invalid');
  }
}
