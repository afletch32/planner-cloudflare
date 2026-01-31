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

export function registerStateRoutes(router, deps) {
  const store = deps.userStateStore;

  router.get('/state', async (req) => {
    const identity = getIdentity(req);
    const identityError = requireIdentity(identity);
    if (identityError) return identityError;
    const { namespace, key } = req.query;
    if (!namespace || !key) {
      return { status: 400, body: { error: 'namespace and key required' } };
    }
    const value = await store.get({
      householdId: identity.householdId,
      personId: identity.personId,
      namespace,
      key
    });
    return { status: 200, body: { value } };
  });

  router.get('/state/list', async (req) => {
    const identity = getIdentity(req);
    const identityError = requireIdentity(identity);
    if (identityError) return identityError;
    const { namespace, prefix = '' } = req.query;
    if (!namespace) {
      return { status: 400, body: { error: 'namespace required' } };
    }
    const items = await store.list({
      householdId: identity.householdId,
      personId: identity.personId,
      namespace,
      prefix
    });
    return { status: 200, body: { items } };
  });

  router.post('/state', async (req) => {
    const identity = getIdentity(req);
    const identityError = requireIdentity(identity);
    if (identityError) return identityError;
    const { namespace, key, value } = req.body || {};
    if (!namespace || !key) {
      return { status: 400, body: { error: 'namespace and key required' } };
    }
    const saved = await store.upsert({
      householdId: identity.householdId,
      personId: identity.personId,
      namespace,
      key,
      value
    });
    return { status: 200, body: saved || {} };
  });
}
