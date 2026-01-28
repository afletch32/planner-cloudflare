import { GoogleService } from '../services/googleService.js';
import { ValidationError, PermissionError } from '../validation/errors.js';
import { ROLE_PARENT } from '../auth/roles.js';

function assertHousehold(actor, householdId) {
  if (actor.householdId && householdId && actor.householdId !== householdId) {
    throw new PermissionError('householdId mismatch');
  }
}

export function registerGoogleRoutes(router, deps) {
  const service = new GoogleService(deps.taskStore, deps.googleStore);

  router.post('/google/push', async (req, ctx) => {
    const { taskId, proposal } = req.body || {};
    const updated = await service.proposeChange(taskId, proposal || {});
    return { status: 200, body: updated };
  });

  router.get('/google/pull', async (req, ctx) => {
    const { householdId } = req.query;
    if (!householdId) {
      return { status: 400, body: { error: 'householdId required' } };
    }
    assertHousehold(ctx.actor, householdId);
    const tasks = await service.listPending(householdId);
    return { status: 200, body: { tasks } };
  });

  router.post('/google/accept', async (req, ctx) => {
    if (ctx.actor.role !== ROLE_PARENT) {
      throw new PermissionError('Only parent can accept Google changes');
    }
    const { taskId } = req.body || {};
    const updated = await service.acceptChange(taskId);
    return { status: 200, body: updated };
  });

  router.post('/google/ignore', async (req, ctx) => {
    if (ctx.actor.role !== ROLE_PARENT) {
      throw new PermissionError('Only parent can ignore Google changes');
    }
    const { taskId } = req.body || {};
    const updated = await service.ignoreChange(taskId);
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
