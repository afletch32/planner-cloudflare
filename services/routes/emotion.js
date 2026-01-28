import { EmotionService } from '../services/emotionService.js';
import { ValidationError, PermissionError } from '../validation/errors.js';

export function registerEmotionRoutes(router, deps) {
  const service = new EmotionService(deps.emotionStore, deps.db);

  router.post('/emotion/checkin', async (req, ctx) => {
    const saved = await service.recordCheckin(req.body || {}, ctx.actor);
    return { status: 200, body: saved };
  });

  router.get('/emotion/status', async (req, ctx) => {
    const status = await service.getStatus(ctx.actor);
    return { status: 200, body: status };
  });

  router.get('/emotion/badges', async (req, ctx) => {
    const badges = await service.listBadges(ctx.actor);
    return { status: 200, body: { badges } };
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
