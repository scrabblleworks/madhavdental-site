// Madhav Dental Clinic — Worker (static assets mode)
// Requires: KV namespace bound as CONTENT_KV, environment secret ADMIN_PASSWORD.
// No assets binding needed — Cloudflare matches real static files (all your
// HTML/CSS/JS pages) BEFORE this script ever runs. This fetch handler only
// executes for paths that aren't real files: /api/content, and genuine 404s.
// The public site is untouched by this script and stays fully open — only
// the POST to /api/content (used by admin.html to save) is password-checked.

const KV_KEY = "site-content";

const DEFAULT_CONTENT = {
  rating: "4.7",
  hours: "Monday – Sunday: 10:00 AM – 8:00 PM",
  reviews: [
    {
      name: "Mallika Preman",
      stars: 5,
      text: "Visited Madhav Dental Clinic last week for a root canal treatment, and I had a very positive experience. The entire procedure was handled with great care and professionalism. Dr. Priti was patient, reassuring, and explained each step clearly, which made the treatment much less stressful and completely painless, quite contrary to what I had anticipated \ud83d\ude0a",
      link: "https://www.google.com/maps/contrib/117586792345419567578/reviews?hl=en-IN"
    }
  ]
};

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password"
  };
}

async function handleGet(env) {
  if (!env.CONTENT_KV) {
    return new Response(JSON.stringify(DEFAULT_CONTENT), { headers: corsHeaders() });
  }
  const stored = await env.CONTENT_KV.get(KV_KEY);
  const data = stored ? stored : JSON.stringify(DEFAULT_CONTENT);
  return new Response(data, { headers: corsHeaders() });
}

async function handlePost(request, env) {
  const providedPassword = request.headers.get("x-admin-password") || "";
  if (!env.ADMIN_PASSWORD || providedPassword !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders()
    });
  }

  if (!env.CONTENT_KV) {
    return new Response(JSON.stringify({ error: "CONTENT_KV not configured" }), {
      status: 500,
      headers: corsHeaders()
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: corsHeaders()
    });
  }

  // Basic shape validation, so a malformed save can't break the public site
  if (typeof body.rating !== "string" || !Array.isArray(body.reviews)) {
    return new Response(JSON.stringify({ error: "Invalid content shape" }), {
      status: 400,
      headers: corsHeaders()
    });
  }
  if (body.hours !== undefined && (typeof body.hours !== "string" || body.hours.length > 300)) {
    return new Response(JSON.stringify({ error: "Invalid hours" }), {
      status: 400,
      headers: corsHeaders()
    });
  }
  for (const r of body.reviews) {
    if (typeof r.name !== "string" || typeof r.text !== "string" || typeof r.stars !== "number") {
      return new Response(JSON.stringify({ error: "Invalid review entry" }), {
        status: 400,
        headers: corsHeaders()
      });
    }
  }

  await env.CONTENT_KV.put(KV_KEY, JSON.stringify(body));
  return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders() });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/content") {
      if (request.method === "GET") return handleGet(env);
      if (request.method === "POST") return handlePost(request, env);
      if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
      return new Response("Method not allowed", { status: 405 });
    }

    // Any other path reaching here means it didn't match a real static file —
    // a genuine 404. This never fires for your actual pages; those are served
    // by Cloudflare directly, before this script runs.
    return new Response("Not found", { status: 404 });
  }
};
