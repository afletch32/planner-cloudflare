import { SyncService } from '../services/syncService.js';
import { ValidationError, PermissionError } from '../validation/errors.js';

export function registerSyncRoutes(router, deps) {
  const service = new SyncService(deps.taskStore, deps.syncStore, deps.db);

  router.post('/sync', async (req, ctx) => {
    try {
      await service.applyQueue(req.body?.queue, ctx.actor);
      const tasks = await deps.taskStore.list({ householdId: ctx.actor.householdId });
      return { status: 200, body: { tasks } };
    } catch (err) {
      const tasks = ctx.actor?.householdId
        ? await deps.taskStore.list({ householdId: ctx.actor.householdId })
        : [];
      throw Object.assign(err, { authoritative: tasks });
    }
  });

  router.onError((err) => {
    if (err instanceof ValidationError) {
      return { status: 400, body: { error: err.message, code: err.code, authoritative: err.authoritative || [] } };
    }
    if (err instanceof PermissionError) {
      return { status: 403, body: { error: err.message, code: err.code, authoritative: err.authoritative || [] } };
    }
    return null;
  });
}
