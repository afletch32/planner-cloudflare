import { ValidationError } from './errors.js';
import { requireUuid } from '../utils/ids.js';
import { ASSIGNEES, CATEGORIES, CONTEXTS, TASK_STATUSES } from '../models/taskModel.js';
import { validateDuration, validateStartMinutes } from './validateTime.js';
import { validateOrder } from './validateOrder.js';

export function validateTask(task) {
  if (!task || typeof task !== 'object') {
    throw new ValidationError('task must be an object');
  }
  requireUuid(task.taskId, 'taskId');
  if (!task.householdId || typeof task.householdId !== 'string') {
    throw new ValidationError('householdId is required');
  }
  if (!task.title || typeof task.title !== 'string') {
    throw new ValidationError('title is required');
  }
  if (!ASSIGNEES.includes(task.assignedTo)) {
    throw new ValidationError('assignedTo is invalid');
  }
  validateDuration(task.duration);
  if (!TASK_STATUSES.includes(task.status)) {
    throw new ValidationError('status is invalid');
  }
  if (!['parent', 'child'].includes(task.createdBy)) {
    throw new ValidationError('createdBy is invalid');
  }
  if (typeof task.locked !== 'boolean') {
    throw new ValidationError('locked must be boolean');
  }
  validateOrder(task.order);
  validateStartMinutes(task.startMinutes);

  if (task.category && !CATEGORIES.includes(task.category)) {
    throw new ValidationError('category is invalid');
  }
  if (task.contexts && !Array.isArray(task.contexts)) {
    throw new ValidationError('contexts must be an array');
  }
  if (Array.isArray(task.contexts)) {
    task.contexts.forEach(ctx => {
      if (!CONTEXTS.includes(ctx)) {
        throw new ValidationError('contexts contains invalid value');
      }
    });
  }

  if (task.google) {
    const g = task.google;
    if (!['off', 'push', 'two-way'].includes(g.syncMode)) {
      throw new ValidationError('google.syncMode invalid');
    }
    if (g.pendingChange) {
      if (g.pendingChange.startMinutes !== undefined) {
        validateStartMinutes(g.pendingChange.startMinutes);
      }
      if (g.pendingChange.date !== undefined && g.pendingChange.date !== null) {
        if (typeof g.pendingChange.date !== 'string') {
          throw new ValidationError('google.pendingChange.date invalid');
        }
      }
    }
  }
}
