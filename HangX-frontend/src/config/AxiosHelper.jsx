import axios from "axios";

export const baseURL = "http://localhost:8080";

export const httpClient = axios.create({ baseURL });

/**
 * Request interceptor — attaches the room JWT from sessionStorage as a
 * Bearer token on every outbound request.
 *
 * The token is read fresh on each request so it always reflects the latest
 * value even if it was updated after the Axios instance was created.
 */
httpClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("hangx_room_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});
