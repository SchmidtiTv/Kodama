export const API = "http://localhost:9847";

export function apiUrl(path) {
  if (/^https?:\/\//.test(path)) return path;
  return `${API}${path.startsWith("/") ? path : `/${path}`}`;
}

export function apiRequest(path, options) {
  return fetch(apiUrl(path), options);
}

export async function requestJson(path, options) {
  const response = await apiRequest(path, options);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${path}`);
  }
  return response.json();
}
