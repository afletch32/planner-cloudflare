import { SchoolCheckinService } from '../services/schoolCheckinService.js';
import { ValidationError, PermissionError } from '../validation/errors.js';

export function registerSchoolRoutes(router, deps) {
  const service = new SchoolCheckinService(deps.schoolCheckinStore);

  router.post('/school/checkin', async (req, ctx) => {
    const saved = await service.recordCheckin(req.body || {}, ctx.actor);
    return { status: 200, body: saved };
  });

  router.get('/school/status', async (req, ctx) => {
    const status = await service.getStatus(ctx.actor);
    return { status: 200, body: status };
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
