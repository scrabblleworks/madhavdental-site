// Cloudflare Pages Function: /api/content
// Requires a KV namespace bound as CONTENT_KV, and an environment variable ADMIN_PASSWORD.
// GET  -> returns current content JSON (public, no auth — needed so the public site can render it)
// POST -> updates content JSON (requires header "x-admin-password" matching ADMIN_PASSWORD)

const KV_KEY = "site-content";

const DEFAULT_CONTENT = {
  rating: "4.7",
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

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.CONTENT_KV) {
    return new Response(JSON.stringify(DEFAULT_CONTENT), { headers: corsHeaders() });
  }
  const stored = await env.CONTENT_KV.get(KV_KEY);
  const data = stored ? stored : JSON.stringify(DEFAULT_CONTENT);
  return new Response(data, { headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;

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

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}
