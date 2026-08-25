import { httpClient } from "../config/AxiosHelper";

// ── Regular user APIs ─────────────────────────────────────────────────────────

export const createRoomApi = async (roomId, userName, password) => {
  const response = await httpClient.post("/api/v1/rooms", {
    roomId,
    userName,
    password: password || undefined,
  });
  return response.data;
};

export const joinChatApi = async (roomId, userName, password) => {
  const response = await httpClient.post(`/api/v1/rooms/${roomId}/join`, {
    userName,
    password,
  });
  return response.data;
};

export const getMessagess = async (roomId, size = 50, page = 0) => {
  const response = await httpClient.get(
    `/api/v1/rooms/${roomId}/messages?size=${size}&page=${page}`
  );
  return response.data;
};

export const deleteMessageApi = async (roomId, messageId, sender) => {
  await httpClient.delete(
    `/api/v1/rooms/${roomId}/messages/${messageId}?sender=${encodeURIComponent(sender)}`
  );
};

// ── Admin APIs ────────────────────────────────────────────────────────────────

const ADMIN_TOKEN_KEY = "hangx_admin_token";

/** Persists the admin JWT into sessionStorage so the Axios interceptor picks it up. */
export const setAdminToken = (token) => {
  if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  else        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const getAdminToken = () => sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";

/**
 * Creates a temporary Axios config that injects the admin token regardless of
 * what is stored under hangx_room_token.
 */
const adminHeaders = () => ({
  headers: { Authorization: `Bearer ${getAdminToken()}` },
});

/** POST /api/v1/admin/login — returns { token } */
export const adminLoginApi = async (password) => {
  const response = await httpClient.post("/api/v1/admin/login", { password });
  return response.data; // { token }
};

/** GET /api/v1/admin/rooms — returns RoomSummary[] */
export const adminListRoomsApi = async () => {
  const response = await httpClient.get("/api/v1/admin/rooms", adminHeaders());
  return response.data;
};

/** GET /api/v1/admin/rooms/{roomId} — returns RoomDetail */
export const adminGetRoomApi = async (roomId) => {
  const response = await httpClient.get(`/api/v1/admin/rooms/${roomId}`, adminHeaders());
  return response.data;
};

/** PUT /api/v1/admin/rooms/{roomId} — { newRoomId, newPassword } → RoomSummary */
export const adminUpdateRoomApi = async (roomId, newRoomId, newPassword) => {
  const response = await httpClient.put(
    `/api/v1/admin/rooms/${roomId}`,
    { newRoomId: newRoomId || undefined, newPassword: newPassword || undefined },
    adminHeaders()
  );
  return response.data;
};

/** DELETE /api/v1/admin/rooms/{roomId} */
export const adminDeleteRoomApi = async (roomId) => {
  await httpClient.delete(`/api/v1/admin/rooms/${roomId}`, adminHeaders());
};

/** DELETE /api/v1/admin/rooms/{roomId}/messages/{messageId} */
export const adminDeleteMessageApi = async (roomId, messageId) => {
  await httpClient.delete(
    `/api/v1/admin/rooms/${roomId}/messages/${messageId}`,
    adminHeaders()
  );
};
