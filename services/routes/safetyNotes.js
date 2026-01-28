import { SafetyNoteService } from '../services/safetyNoteService.js';
import { ValidationError, PermissionError } from '../validation/errors.js';

export function registerSafetyNoteRoutes(router, deps) {
  const service = new SafetyNoteService(deps.safetyNoteStore);

  router.post('/admin/safety-notes', async (req, ctx) => {
    const payload = {
      ...(req.body || {}),
      userId: req.body?.userId || req.body?.user_id
    };
    const created = await service.createNote(payload, ctx.actor);
    return { status: 200, body: created };
  });

  router.get('/admin/safety-notes', async (req, ctx) => {
    const notes = await service.listNotes(req.query.user_id, ctx.actor);
    return { status: 200, body: { notes } };
  });

  router.patch('/admin/safety-notes/:id', async (req, ctx) => {
    const updated = await service.updateResolved(req.params.id, req.body || {}, ctx.actor);
    return { status: 200, body: updated };
  });

  router.onError((err) => {
    if (err instanceof ValidationError) {
      return { status: 400, body: { error: err.message, code: err.code } };
    }
    if (err instanceof PermissionError) {
      return { status: 403, body: { error: err.message, code: err.code } };
    }
    return null;
  });
}
