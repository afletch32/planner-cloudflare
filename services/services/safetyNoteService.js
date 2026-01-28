import { validateSafetyNote, validateSafetyNotePatch } from '../validation/validateSafetyNote.js';
import { ValidationError } from '../validation/errors.js';
import { enforceAdminPermissions } from './permissionService.js';

export class SafetyNoteService {
  constructor(safetyNoteStore) {
    this.safetyNoteStore = safetyNoteStore;
  }

  async createNote(payload, actor) {
    enforceAdminPermissions(actor.role);
    validateSafetyNote(payload);
    const note = {
      id: crypto.randomUUID(),
      userId: payload.userId,
      createdBy: actor.userId,
      note: payload.note,
      resolved: false
    };
    return this.safetyNoteStore.create(note);
  }

  async listNotes(userId, actor) {
    enforceAdminPermissions(actor.role);
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('user_id required');
    }
    return this.safetyNoteStore.listByUserId(userId);
  }

  async updateResolved(id, patch, actor) {
    enforceAdminPermissions(actor.role);
    validateSafetyNotePatch(patch);
    const updated = await this.safetyNoteStore.updateResolved(id, patch.resolved);
    if (!updated) {
      throw new ValidationError('Safety note not found', 'NOT_FOUND');
    }
    return updated;
  }
}
