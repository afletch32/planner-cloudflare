import { WeeklyMissionService } from '../services/weeklyMissionService.js';
import { ValidationError, PermissionError } from '../validation/errors.js';

export function registerWeeklyMissionRoutes(router, deps) {
  const service = new WeeklyMissionService(deps.weeklyMissionStore, deps.db);

  router.get('/missions/weekly', async (req, ctx) => {
    const missions = await service.getWeeklyMissions(ctx.actor);
    return { status: 200, body: { missions } };
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
