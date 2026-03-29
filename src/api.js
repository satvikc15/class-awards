const getBaseUrl = () => import.meta.env.VITE_API_URL || "";

async function readBody(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiGet(path) {
  const res = await fetch(getBaseUrl() + path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const body = await readBody(res);
  if (!res.ok) {
    throw new Error(typeof body === "string" ? body : body.detail || "Request failed");
  }
  return body;
}

export async function apiPost(path, payload) {
  const res = await fetch(getBaseUrl() + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const body = await readBody(res);
  if (!res.ok) {
    throw new Error(typeof body === "string" ? body : body.detail || "Request failed");
  }
  return body;
}
