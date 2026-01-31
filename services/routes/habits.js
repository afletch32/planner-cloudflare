function getIdentity(req) {
  const householdId = req.query.householdId || req.body?.householdId;
  const personId = req.query.personId || req.body?.personId;
  return { householdId, personId };
}

function requireIdentity(identity) {
  if (!identity.householdId || !identity.personId) {
    return {
      status: 400,
      body: { error: 'householdId and personId required' }
    };
  }
  return null;
}

const HABITS_NAMESPACE = 'habits';
const HABITS_KEY = 'categories';

export function registerHabitsRoutes(router, deps) {
  const store = deps.userStateStore;

  router.get('/habits', async (req) => {
    const identity = getIdentity(req);
    const identityError = requireIdentity(identity);
    if (identityError) return identityError;
    const value = await store.get({
      householdId: identity.householdId,
      personId: identity.personId,
      namespace: HABITS_NAMESPACE,
      key: HABITS_KEY
    });
    return { status: 200, body: { habits: Array.isArray(value) ? value : [] } };
  });

  router.post('/habits', async (req) => {
    const identity = getIdentity(req);
    const identityError = requireIdentity(identity);
    if (identityError) return identityError;
    const habits = Array.isArray(req.body?.habits) ? req.body.habits : [];
    await store.upsert({
      householdId: identity.householdId,
      personId: identity.personId,
      namespace: HABITS_NAMESPACE,
      key: HABITS_KEY,
      value: habits
    });
    return { status: 200, body: { habits } };
  });
}
