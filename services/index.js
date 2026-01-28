import { getEnv } from './env.js';
import { createDb } from '../db/db.js';
import { TaskStore } from '../storage/taskStore.js';
import { SyncStore } from '../storage/syncStore.js';
import { GoogleStore } from '../storage/googleStore.js';
import { EmotionStore } from '../storage/emotionStore.js';
import { SafetyNoteStore } from '../storage/safetyNoteStore.js';
import { SchoolCheckinStore } from '../storage/schoolCheckinStore.js';
import { WeeklyMissionStore } from '../storage/weeklyMissionStore.js';
import { registerTaskRoutes } from './routes/tasks.js';
import { registerSyncRoutes } from './routes/sync.js';
import { registerGoogleRoutes } from './routes/google.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerEmotionRoutes } from './routes/emotion.js';
import { registerSafetyNoteRoutes } from './routes/safetyNotes.js';
import { registerSchoolRoutes } from './routes/school.js';
import { registerWeeklyMissionRoutes } from './routes/weeklyMissions.js';
import { requireAuth } from './auth/authMiddleware.js';

class Router {
  constructor() {
    this.routes = [];
    this.errorHandlers = [];
  }
  get(path, handler) { this.routes.push({ method: 'GET', path, handler }); }
  post(path, handler) { this.routes.push({ method: 'POST', path, handler }); }
  patch(path, handler) { this.routes.push({ method: 'PATCH', path, handler }); }
  onError(handler) { this.errorHandlers.push(handler); }
  match(method, pathname) {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const params = {};
      const routeParts = route.path.split('/').filter(Boolean);
      const pathParts = pathname.split('/').filter(Boolean);
      if (routeParts.length !== pathParts.length) continue;
      let ok = true;
      for (let i = 0; i < routeParts.length; i++) {
        const rp = routeParts[i];
        const pp = pathParts[i];
        if (rp.startsWith(':')) {
          params[rp.slice(1)] = pp;
        } else if (rp !== pp) {
          ok = false;
          break;
        }
      }
      if (ok) return { handler: route.handler, params };
    }
    return null;
  }
}

async function parseBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return null;
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return req.json();
  }
  return null;
}

export default {
  async fetch(request, envBindings) {
    const env = getEnv(envBindings);
    const router = new Router();
    const db = createDb(env);
    const deps = {
      db,
      taskStore: new TaskStore(db),
      syncStore: new SyncStore(db),
      googleStore: new GoogleStore(db),
      emotionStore: new EmotionStore(db),
      safetyNoteStore: new SafetyNoteStore(db),
      schoolCheckinStore: new SchoolCheckinStore(db),
      weeklyMissionStore: new WeeklyMissionStore(db)
    };

    registerTaskRoutes(router, deps);
    registerSyncRoutes(router, deps);
    registerGoogleRoutes(router, deps);
    registerEmotionRoutes(router, deps);
    registerSafetyNoteRoutes(router, deps);
    registerSchoolRoutes(router, deps);
    registerWeeklyMissionRoutes(router, deps);
    registerHealthRoutes(router);

    const url = new URL(request.url);
    const match = router.match(request.method, url.pathname);
    if (!match) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    let body = null;
    try {
      body = await parseBody(request);
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    let actor = null;
    if (url.pathname !== '/health') {
      try {
        actor = await requireAuth(request, env);
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 401 });
      }
    }

    const ctx = {
      actor,
      env,
      deps
    };
    const req = {
      params: match.params,
      query: Object.fromEntries(url.searchParams.entries()),
      body
    };

    try {
      const result = await match.handler(req, ctx);
      return new Response(JSON.stringify(result.body || {}), {
        status: result.status || 200,
        headers: { 'content-type': 'application/json' }
      });
    } catch (err) {
      for (const handler of router.errorHandlers) {
        const handled = handler(err);
        if (handled) {
          return new Response(JSON.stringify(handled.body || {}), {
            status: handled.status || 500,
            headers: { 'content-type': 'application/json' }
          });
        }
      }
      return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
  }
};
