import { TaskService } from '../services/taskService.js';
import { ValidationError, PermissionError } from '../validation/errors.js';

function assertHousehold(actor, householdId) {
  if (actor.householdId && householdId && actor.householdId !== householdId) {
    throw new PermissionError('householdId mismatch');
  }
}

export function registerTaskRoutes(router, deps) {
  const service = new TaskService(deps.taskStore);

  router.get('/tasks', async (req, ctx) => {
    const { householdId, assignedTo, date } = req.query;
    if (!householdId) {
      return { status: 400, body: { error: 'householdId required' } };
    }
    assertHousehold(ctx.actor, householdId);
    const tasks = await service.listTasks({ householdId, assignedTo, date });
    return { status: 200, body: { tasks } };
  });

  router.post('/task', async (req, ctx) => {
    try {
      const task = req.body;
      assertHousehold(ctx.actor, task?.householdId);
      const saved = await service.upsertTask(task, ctx.actor);
      return { status: 200, body: saved };
    } catch (err) {
      const taskId = req.body?.taskId;
      const existing = taskId ? await deps.taskStore.get(taskId) : null;
      throw Object.assign(err, { authoritative: existing });
    }
  });

  router.patch('/task/:id', async (req, ctx) => {
    const taskId = req.params.id;
    try {
      const existing = await deps.taskStore.get(taskId);
      if (existing) assertHousehold(ctx.actor, existing.householdId);
      const updated = await service.updateTask(taskId, req.body, ctx.actor);
      return { status: 200, body: updated };
    } catch (err) {
      const existing = await deps.taskStore.get(taskId);
      throw Object.assign(err, { authoritative: existing });
    }
  });

  router.onError((err) => {
    if (err instanceof ValidationError) {
      return { status: 400, body: { error: err.message, code: err.code, authoritative: err.authoritative || null } };
    }
    if (err instanceof PermissionError) {
      return { status: 403, body: { error: err.message, code: err.code, authoritative: err.authoritative || null } };
    }
    return null;
  });
}
