export function registerHealthRoutes(router) {
  router.get('/health', async () => ({ status: 200, body: { ok: true } }));
}
