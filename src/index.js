export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS 허용
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "GET,HEAD,OPTIONS",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // 헬스체크
    if (url.pathname === "/ping") {
      return json({ ok: true, ts: Date.now() }, cors);
    }

    // === schoolInfo ===
    if (url.pathname === "/api/neis/schoolInfo" || url.pathname === "/schoolInfo") {
      const neis = new URL("https://open.neis.go.kr/hub/schoolInfo");
      copyQuery(url.searchParams, neis.searchParams);
      neis.searchParams.set("KEY", env.NEIS_KEY);
      neis.searchParams.set("Type", "json");
      const r = await fetch(neis, { headers: { Accept: "application/json" } });
      return proxyResponse(r, cors);
    }

    // === timetable(초/중/고 공통) ===
    const m = url.pathname.match(
      /^\/(?:api\/neis\/timetable|timetable)\/(elsTimetable|misTimetable|hisTimetable)$/
    );
    if (m) {
      const endpoint = m[1];
      const neis = new URL(`https://open.neis.go.kr/hub/${endpoint}`);
      copyQuery(url.searchParams, neis.searchParams);
      neis.searchParams.set("KEY", env.NEIS_KEY);
      neis.searchParams.set("Type", "json");
      const r = await fetch(neis, { headers: { Accept: "application/json" } });
      return proxyResponse(r, cors);
    }

    return new Response("Not Found", { status: 404, headers: cors });
  },
};

function copyQuery(from, to) {
  for (const [k, v] of from.entries()) to.set(k, v);
}

async function proxyResponse(r, cors) {
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json",
      ...cors,
    },
  });
}

function json(obj, cors) {
  return new Response(JSON.stringify(obj), {
    headers: { "content-type": "application/json; charset=utf-8", ...cors },
  });
}
