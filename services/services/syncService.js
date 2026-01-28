import { validateUpdate } from '../validation/validateUpdate.js';
import { validateTask } from '../validation/validateTask.js';
import { enforceTaskCreatePermissions, enforceTaskUpdatePermissions } from './permissionService.js';
import { normalizeTask } from '../models/taskModel.js';
import { ValidationError } from '../validation/errors.js';

export class SyncService {
  constructor(taskStore, syncStore, db) {
    this.taskStore = taskStore;
    this.syncStore = syncStore;
    this.db = db;
  }

  async applyQueue(queue, actor) {
    if (!Array.isArray(queue) || queue.length === 0) {
      throw new ValidationError('sync queue is empty');
    }

    // Sync is atomic to prevent partial state when offline clients replay.
    return this.db.withTransaction(async () => {
      for (const item of queue) {
        if (!item || typeof item !== 'object') {
          throw new ValidationError('Invalid sync item');
        }
        if (item.type === 'upsert') {
          const task = normalizeTask(item.task);
          validateTask(task);
          enforceTaskCreatePermissions(actor.role, task);
          await this.taskStore.upsert(task);
          continue;
        }
        if (item.type === 'patch') {
          validateUpdate(item.patch || {});
          const existing = await this.taskStore.get(item.taskId);
          if (!existing) {
            throw new ValidationError('Task not found');
          }
          enforceTaskUpdatePermissions(actor.role, existing, item.patch || {});
          const merged = { ...existing, ...item.patch };
          validateTask(merged);
          await this.taskStore.update(item.taskId, item.patch || {});
          continue;
        }
        throw new ValidationError('Unknown sync item type');
      }

      await this.syncStore.recordSync(actor.householdId, actor.userId, queue);
      return { ok: true };
    });
  }
}
