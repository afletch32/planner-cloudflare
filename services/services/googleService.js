import { validateUpdate } from '../validation/validateUpdate.js';
import { validateTask } from '../validation/validateTask.js';
import { ValidationError } from '../validation/errors.js';

export class GoogleService {
  constructor(taskStore, googleStore) {
    this.taskStore = taskStore;
    this.googleStore = googleStore;
  }

  async proposeChange(taskId, proposal) {
    validateUpdate({ startMinutes: proposal.startMinutes, date: proposal.date });
    const existing = await this.taskStore.get(taskId);
    if (!existing) throw new ValidationError('Task not found');
    const updatedGoogle = {
      ...(existing.google || { eventId: null, calendarId: null, syncMode: 'off', pendingChange: null }),
      pendingChange: {
        ...(proposal.startMinutes !== undefined ? { startMinutes: proposal.startMinutes } : {}),
        ...(proposal.date !== undefined ? { date: proposal.date } : {})
      }
    };
    const merged = { ...existing, google: updatedGoogle };
    validateTask(merged);
    return this.taskStore.update(taskId, { google: updatedGoogle });
  }

  async listPending(householdId) {
    return this.taskStore.listPendingGoogle(householdId);
  }

  async acceptChange(taskId) {
    const existing = await this.taskStore.get(taskId);
    if (!existing) throw new ValidationError('Task not found');
    const pending = existing.google?.pendingChange;
    if (!pending) throw new ValidationError('No pending change');
    const patch = {
      ...(pending.startMinutes !== undefined ? { startMinutes: pending.startMinutes } : {}),
      ...(pending.date !== undefined ? { date: pending.date } : {}),
      google: { ...existing.google, pendingChange: null }
    };
    validateUpdate(patch);
    const merged = { ...existing, ...patch };
    validateTask(merged);
    return this.taskStore.update(taskId, patch);
  }

  async ignoreChange(taskId) {
    const existing = await this.taskStore.get(taskId);
    if (!existing) throw new ValidationError('Task not found');
    const updatedGoogle = { ...existing.google, pendingChange: null };
    return this.taskStore.update(taskId, { google: updatedGoogle });
  }
}
