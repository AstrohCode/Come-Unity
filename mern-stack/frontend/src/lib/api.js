// frontend/src/lib/api.js

const baseUrl = import.meta.env.VITE_API_URL; 
// Example: http://localhost:5001

async function request(path, { method = "GET", body } = {}) {
  const url = `${baseUrl}${path}`;

  const headers = {};

  // Add token if stored
  const raw = localStorage.getItem("user");
  if (raw) {
    let token = null;
    try {
      const parsed = JSON.parse(raw);
      token = parsed?.token || null;
    } catch {
      token = null;
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const options = { method, headers };

  if (body) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export default {
  request,
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};
