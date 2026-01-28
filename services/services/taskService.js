import { normalizeTask } from '../models/taskModel.js';
import { validateTask } from '../validation/validateTask.js';
import { validateUpdate } from '../validation/validateUpdate.js';
import { enforceTaskCreatePermissions, enforceTaskUpdatePermissions } from './permissionService.js';
import { ValidationError } from '../validation/errors.js';
import { ROLE_PARENT } from '../auth/roles.js';

export class TaskService {
  constructor(taskStore) {
    this.taskStore = taskStore;
  }

  async listTasks(query) {
    return this.taskStore.list(query);
  }

  async upsertTask(task, actor) {
    const normalized = normalizeTask(task);
    validateTask(normalized);
    enforceTaskCreatePermissions(actor.role, normalized);
    return this.taskStore.upsert(normalized);
  }

  async updateTask(taskId, patch, actor) {
    validateUpdate(patch);
    const existing = await this.taskStore.get(taskId);
    if (!existing) {
      throw new ValidationError('Task not found', 'NOT_FOUND');
    }
    enforceTaskUpdatePermissions(actor.role, existing, patch);

    let nextPatch = { ...patch };
    if (actor.role === ROLE_PARENT && existing.google?.pendingChange) {
      const touchedKeys = Object.keys(patch || {}).filter(k => k !== 'google');
      if (touchedKeys.length) {
        nextPatch = {
          ...nextPatch,
          google: { ...existing.google, pendingChange: null }
        };
      }
    }

    const merged = { ...existing, ...nextPatch, taskId: existing.taskId };
    validateTask(merged);
    return this.taskStore.update(taskId, nextPatch);
  }
}
