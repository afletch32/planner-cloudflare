export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    if (!key) {
      return new Response("Not Found", { status: 404 });
    }
    const object = await env.ASSETS_BUCKET.get(key);
    if (!object) {
      return new Response("Not Found", { status: 404 });
    }
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    return new Response(object.body, { headers });
  },
};
